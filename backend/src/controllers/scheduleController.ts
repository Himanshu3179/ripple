import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import ScheduledPost from '../models/ScheduledPost';
import Community from '../models/Community';
import { ensureActiveMembership } from '../services/communityAccess';

const isPremium = (tier: string | undefined) => tier === 'star-pass' || tier === 'star-unlimited';

export const listScheduledPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const posts = await ScheduledPost.find({ author: req.user._id, status: { $ne: 'cancelled' } })
      .sort({ scheduledFor: 1 })
      .lean();

    res.status(200).json({ posts });
  } catch (error) {
    next(error as Error);
  }
};

export const schedulePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!isPremium(req.user.membershipTier)) {
      res.status(403).json({ message: 'Upgrade to Star Pass to schedule posts' });
      return;
    }

    const { title, body, topic, imageUrl, communityId, scheduledFor } = req.body as Record<string, string>;

    if (!title || !topic || !scheduledFor) {
      res.status(400).json({ message: 'Title, topic, and scheduled time are required' });
      return;
    }

    const scheduleDate = new Date(scheduledFor);
    if (Number.isNaN(scheduleDate.getTime()) || scheduleDate.getTime() < Date.now()) {
      res.status(400).json({ message: 'Scheduled time must be in the future' });
      return;
    }

    let community: { _id: Types.ObjectId } | null = null;
    if (communityId) {
      community = await Community.findOne(
        Types.ObjectId.isValid(communityId)
          ? { _id: communityId }
          : { slug: communityId.toLowerCase() },
      );

      if (!community) {
        res.status(404).json({ message: 'Community not found' });
        return;
      }

      const membership = await ensureActiveMembership(community._id, req.user._id);
      if (!membership) {
        res.status(403).json({ message: 'You must be an active member to schedule here' });
        return;
      }
    }

    const scheduled = await ScheduledPost.create({
      author: req.user._id,
      community: community?._id ?? null,
      title: title.trim(),
      body,
      topic: topic.trim().toLowerCase(),
      imageUrl,
      scheduledFor: scheduleDate,
      status: 'scheduled',
      attempts: 0,
    });

    res.status(201).json({ scheduled });
  } catch (error) {
    next(error as Error);
  }
};

export const cancelScheduledPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { scheduledId } = req.params;
    if (!Types.ObjectId.isValid(scheduledId)) {
      res.status(400).json({ message: 'Invalid scheduled post id' });
      return;
    }

    const scheduled = await ScheduledPost.findById(scheduledId);
    if (!scheduled || !scheduled.author.equals(req.user._id)) {
      res.status(404).json({ message: 'Scheduled post not found' });
      return;
    }

    if (scheduled.status !== 'scheduled') {
      res.status(400).json({ message: 'Cannot cancel this scheduled post' });
      return;
    }

    scheduled.status = 'cancelled';
    await scheduled.save();

    res.status(200).json({ message: 'Scheduled post cancelled' });
  } catch (error) {
    next(error as Error);
  }
};
