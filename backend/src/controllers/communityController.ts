import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Community, { ICommunityDocument, CommunityVisibility } from '../models/Community';
import CommunityMember, {
  CommunityMemberRole,
  CommunityMemberStatus,
} from '../models/CommunityMember';
import CommunityInvite from '../models/CommunityInvite';
import { generateReferralCode } from '../utils/referralCode';
import { slugify } from '../utils/slugify';

const findCommunityByIdentifier = async (identifier: string) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return Community.findById(identifier);
  }
  return Community.findOne({ slug: identifier.toLowerCase() });
};

const ensureMembership = async (
  community: ICommunityDocument,
  userId: string,
) => CommunityMember.findOne({ community: community._id, user: userId });

const serializeCommunity = (
  community: ICommunityDocument,
  membership?: { role: CommunityMemberRole; status: CommunityMemberStatus } | null,
) => ({
  id: community._id,
  name: community.name,
  slug: community.slug,
  description: community.description,
  visibility: community.visibility,
  avatarImage: community.avatarImage,
  bannerImage: community.bannerImage,
  memberCount: community.memberCount,
  createdAt: community.createdAt,
  membership,
});

export const listCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const memberships = await CommunityMember.find({
      user: req.user._id,
      status: 'active',
    })
      .populate('community')
      .sort({ createdAt: -1 });

    const communities = memberships
      .map((membership) => {
        const communityDoc = membership.community as unknown as ICommunityDocument | null;
        if (!communityDoc || !(communityDoc as any).name) {
          return null;
        }
        return serializeCommunity(communityDoc, {
          role: membership.role,
          status: membership.status,
        });
      })
      .filter((item): item is ReturnType<typeof serializeCommunity> => Boolean(item));

    res.status(200).json({ communities });
  } catch (error) {
    next(error as Error);
  }
};

export const createCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { name, description, visibility }: {
      name: string;
      description?: string;
      visibility?: CommunityVisibility;
    } = req.body;

    if (!name || name.trim().length < 3) {
      res.status(400).json({ message: 'Community name is required' });
      return;
    }

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (await Community.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const community = await Community.create({
      name: name.trim(),
      slug,
      description: description?.trim(),
      creator: req.user._id,
      visibility: visibility || 'public',
    });

    await CommunityMember.create({
      community: community._id,
      user: req.user._id,
      role: 'owner',
      status: 'active',
    });

    res.status(201).json({ community: serializeCommunity(community, { role: 'owner', status: 'active' }) });
  } catch (error) {
    next(error as Error);
  }
};

export const getCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = req.params as { identifier: string };
    const community = await findCommunityByIdentifier(identifier);

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    let membership: { role: CommunityMemberRole; status: CommunityMemberStatus } | null = null;
    if (req.user) {
      const memberDoc = await ensureMembership(community, req.user._id.toString());
      if (memberDoc) {
        membership = { role: memberDoc.role, status: memberDoc.status };
      }
    }

    if (!membership && community.visibility === 'private') {
      res.status(403).json({ message: 'Community is private' });
      return;
    }

    res.status(200).json({ community: serializeCommunity(community, membership) });
  } catch (error) {
    next(error as Error);
  }
};

export const updateCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier } = req.params as { identifier: string };
    const community = await findCommunityByIdentifier(identifier);

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const membership = await ensureMembership(community, req.user._id.toString());

    if (!membership || (membership.role !== 'owner' && membership.role !== 'moderator')) {
      res.status(403).json({ message: 'You cannot update this community' });
      return;
    }

    const allowed: Array<keyof ICommunityDocument> = ['name', 'description', 'visibility', 'avatarImage', 'bannerImage'];
    allowed.forEach((field) => {
      if (field in req.body) {
        (community as any)[field] = req.body[field];
      }
    });

    await community.save();

    res.status(200).json({ community: serializeCommunity(community, { role: membership.role, status: membership.status }) });
  } catch (error) {
    next(error as Error);
  }
};

export const joinCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier } = req.params as { identifier: string };
    const { inviteCode } = req.body as { inviteCode?: string };
    const community = await findCommunityByIdentifier(identifier);

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const existing = await ensureMembership(community, req.user._id.toString());
    if (existing) {
      if (existing.status === 'banned') {
        res.status(403).json({ message: 'You are banned from this community' });
        return;
      }
      res.status(200).json({ community: serializeCommunity(community, { role: existing.role, status: existing.status }) });
      return;
    }

    let status: CommunityMemberStatus = 'active';

    if (community.visibility === 'private') {
      if (!inviteCode) {
        res.status(403).json({ message: 'Invite required to join this community' });
        return;
      }

      const invite = await CommunityInvite.findOne({ code: inviteCode, community: community._id, revoked: false });
      if (!invite) {
        res.status(400).json({ message: 'Invalid invite code' });
        return;
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        res.status(400).json({ message: 'Invite expired' });
        return;
      }
      if (invite.maxUses && invite.uses >= invite.maxUses) {
        res.status(400).json({ message: 'Invite no longer valid' });
        return;
      }
      invite.uses += 1;
      await invite.save();
    } else if (community.visibility === 'restricted') {
      status = 'pending';
    }

    await CommunityMember.create({
      community: community._id,
      user: req.user._id,
      role: 'member',
      status,
    });

    if (status === 'active') {
      community.memberCount += 1;
      await community.save();
    }

    res.status(200).json({
      community: serializeCommunity(community, { role: 'member', status }),
      message: status === 'active' ? 'Joined community' : 'Membership request submitted',
    });
  } catch (error) {
    next(error as Error);
  }
};

export const leaveCommunity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier } = req.params as { identifier: string };
    const community = await findCommunityByIdentifier(identifier);

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const membership = await ensureMembership(community, req.user._id.toString());
    if (!membership) {
      res.status(400).json({ message: 'You are not a member' });
      return;
    }

    if (membership.role === 'owner') {
      res.status(400).json({ message: 'Owner cannot leave the community' });
      return;
    }

    await membership.deleteOne();

    if (membership.status === 'active' && community.memberCount > 0) {
      community.memberCount -= 1;
      await community.save();
    }

    res.status(200).json({ message: 'Left community' });
  } catch (error) {
    next(error as Error);
  }
};

export const listMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier } = req.params as { identifier: string };
    const community = await findCommunityByIdentifier(identifier);

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const membership = await ensureMembership(community, req.user._id.toString());
    if (!membership || (membership.role !== 'owner' && membership.role !== 'moderator')) {
      res.status(403).json({ message: 'You cannot view members' });
      return;
    }

    const members = await CommunityMember.find({ community: community._id })
      .populate('user', 'username displayName avatarColor')
      .sort({ role: 1, createdAt: 1 });

    res.status(200).json({ members });
  } catch (error) {
    next(error as Error);
  }
};

export const reviewMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier, memberId } = req.params as { identifier: string; memberId: string };
    const { action } = req.body as { action: 'approve' | 'reject' | 'ban' };

    const community = await findCommunityByIdentifier(identifier);
    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const actingMembership = await ensureMembership(community, req.user._id.toString());
    if (!actingMembership || (actingMembership.role !== 'owner' && actingMembership.role !== 'moderator')) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    const targetMembership = await CommunityMember.findById(memberId);
    if (!targetMembership || !targetMembership.community.equals(community._id)) {
      res.status(404).json({ message: 'Membership not found' });
      return;
    }

    if (action === 'approve') {
      if (targetMembership.status !== 'pending') {
        res.status(400).json({ message: 'Membership is not pending' });
        return;
      }
      targetMembership.status = 'active';
      targetMembership.joinedAt = new Date();
      await targetMembership.save();
      community.memberCount += 1;
      await community.save();
    } else if (action === 'reject') {
      await targetMembership.deleteOne();
    } else if (action === 'ban') {
      targetMembership.status = 'banned';
      await targetMembership.save();
    }

    res.status(200).json({ message: 'Membership updated' });
  } catch (error) {
    next(error as Error);
  }
};

export const createInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier } = req.params as { identifier: string };
    const { maxUses, expiresAt } = req.body as { maxUses?: number; expiresAt?: string };

    const community = await findCommunityByIdentifier(identifier);
    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const membership = await ensureMembership(community, req.user._id.toString());
    if (!membership || (membership.role !== 'owner' && membership.role !== 'moderator')) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    const code = generateReferralCode(10);
    const invite = await CommunityInvite.create({
      community: community._id,
      createdBy: req.user._id,
      code,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({ invite });
  } catch (error) {
    next(error as Error);
  }
};
