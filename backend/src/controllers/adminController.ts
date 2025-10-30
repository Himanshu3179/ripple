import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import Community from '../models/Community';

const normalizeSearch = (value?: string) => value?.trim().replace(/\s+/g, ' ') ?? '';

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', limit = '50' } = req.query as { search?: string; limit?: string };
    const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 100);

    const normalizedSearch = normalizeSearch(search);
    const query =
      normalizedSearch.length > 0
        ? {
            $or: [
              { username: { $regex: normalizedSearch, $options: 'i' } },
              { email: { $regex: normalizedSearch, $options: 'i' } },
              { displayName: { $regex: normalizedSearch, $options: 'i' } },
            ],
          }
        : {};

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .select('username displayName email role membershipTier starsBalance createdAt')
      .lean();

    res.status(200).json({
      users: users.map((user) => ({
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier,
        starsBalance: user.starsBalance ?? 0,
        createdAt: user.createdAt ?? null,
      })),
    });
  } catch (error) {
    next(error as Error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string };
    const { role } = req.body as { role: 'user' | 'admin' };

    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user id' });
      return;
    }

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true, runValidators: true },
    ).select('username displayName email role membershipTier starsBalance createdAt');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier,
        starsBalance: user.starsBalance ?? 0,
        createdAt: user.createdAt ?? null,
      },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const listCommunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', limit = '50' } = req.query as { search?: string; limit?: string };
    const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 100);
    const normalizedSearch = normalizeSearch(search);

    const query =
      normalizedSearch.length > 0
        ? {
            $or: [
              { name: { $regex: normalizedSearch, $options: 'i' } },
              { slug: { $regex: normalizedSearch, $options: 'i' } },
            ],
          }
        : {};

    const communities = await Community.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .select('name slug visibility memberCount createdAt')
      .lean();

    res.status(200).json({
      communities: communities.map((community) => ({
        id: community._id.toString(),
        name: community.name,
        slug: community.slug,
        visibility: community.visibility,
        memberCount: community.memberCount,
        createdAt: community.createdAt ?? null,
      })),
    });
  } catch (error) {
    next(error as Error);
  }
};

export const updateCommunityVisibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { communityId } = req.params as { communityId: string };
    const { visibility } = req.body as { visibility: 'public' | 'restricted' | 'private' };

    if (!Types.ObjectId.isValid(communityId)) {
      res.status(400).json({ message: 'Invalid community id' });
      return;
    }

    if (!['public', 'restricted', 'private'].includes(visibility)) {
      res.status(400).json({ message: 'Invalid visibility' });
      return;
    }

    const community = await Community.findByIdAndUpdate(
      communityId,
      { $set: { visibility } },
      { new: true, runValidators: true },
    ).select('name slug visibility memberCount createdAt');

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    res.status(200).json({
      community: {
        id: community._id.toString(),
        name: community.name,
        slug: community.slug,
        visibility: community.visibility,
        memberCount: community.memberCount,
        createdAt: community.createdAt ?? null,
      },
    });
  } catch (error) {
    next(error as Error);
  }
};
