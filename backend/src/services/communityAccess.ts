import { Types } from 'mongoose';
import Community, { ICommunityDocument, CommunityVisibility } from '../models/Community';
import CommunityMember, { CommunityMemberStatus } from '../models/CommunityMember';

export type CommunitySummary = {
  _id: Types.ObjectId;
  visibility: CommunityVisibility;
  name?: string;
  slug?: string;
};

export const toCommunitySummary = (community: any): CommunitySummary | null => {
  if (!community) return null;
  return {
    _id: community._id as Types.ObjectId,
    visibility: community.visibility as CommunityVisibility,
    name: community.name,
    slug: community.slug,
  };
};

export const loadMembershipMap = async (communityIds: string[], viewerId?: string | null) => {
  const map = new Map<string, CommunityMemberStatus>();
  if (!viewerId || communityIds.length === 0) {
    return map;
  }

  const memberships = await CommunityMember.find({
    community: { $in: communityIds },
    user: viewerId,
  });

  memberships.forEach((membership) => {
    map.set(membership.community.toString(), membership.status);
  });

  return map;
};

export const isCommunityAccessible = (
  community: CommunitySummary | null | undefined,
  memberships: Map<string, CommunityMemberStatus>,
  viewerId?: string,
) => {
  if (!community) return true;
  if (community.visibility === 'public') return true;
  if (!viewerId) return false;
  const status = memberships.get(community._id.toString());
  return status === 'active';
};

export const ensureActiveMembership = async (communityId: Types.ObjectId, userId: Types.ObjectId) =>
  CommunityMember.findOne({
    community: communityId,
    user: userId,
    status: 'active',
  });

export const findCommunityByIdentifier = async (identifier: string) => {
  if (Types.ObjectId.isValid(identifier)) {
    return Community.findById(identifier);
  }
  return Community.findOne({ slug: identifier.toLowerCase() });
};
