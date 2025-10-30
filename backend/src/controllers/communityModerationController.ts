import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import Community from '../models/Community';
import CommunityMember from '../models/CommunityMember';
import CommunitySettings from '../models/CommunitySettings';
import Post from '../models/Post';
import Comment from '../models/Comment';
import AuditLog from '../models/AuditLog';
import { createNotification } from '../services/notificationService';

const ensureModerator = async (communityId: Types.ObjectId, userId: Types.ObjectId) => {
  const membership = await CommunityMember.findOne({ community: communityId, user: userId });
  if (!membership) return null;
  if (membership.role === 'owner' || membership.role === 'moderator') return membership;
  return null;
};

export const updateCommunitySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier } = req.params as { identifier: string };
    const community = await Community.findOne(
      Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { slug: identifier.toLowerCase() },
    );

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const moderator = await ensureModerator(community._id, req.user._id);
    if (!moderator) {
      res.status(403).json({ message: 'Moderator permissions required' });
      return;
    }

    const { bannedKeywords, allowExternalLinks, slowModeSeconds } = req.body as {
      bannedKeywords?: string[];
      allowExternalLinks?: boolean;
      slowModeSeconds?: number;
    };

    const settings = await CommunitySettings.findOneAndUpdate(
      { community: community._id },
      {
        $set: {
          ...(Array.isArray(bannedKeywords) ? { bannedKeywords } : {}),
          ...(typeof allowExternalLinks === 'boolean' ? { allowExternalLinks } : {}),
          ...(typeof slowModeSeconds === 'number' ? { slowModeSeconds } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await AuditLog.create({
      actor: req.user._id,
      action: 'community_settings_update',
      targetType: 'community',
      targetId: community._id,
      metadata: { bannedKeywords, allowExternalLinks, slowModeSeconds },
    });

    res.status(200).json({ settings });
  } catch (error) {
    next(error as Error);
  }
};

export const removePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier, postId } = req.params as { identifier: string; postId: string };
    if (!Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: 'Invalid post id' });
      return;
    }

    const community = await Community.findOne(
      Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { slug: identifier.toLowerCase() },
    );

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const moderator = await ensureModerator(community._id, req.user._id);
    if (!moderator) {
      res.status(403).json({ message: 'Moderator permissions required' });
      return;
    }

    const post = await Post.findById(postId);
    if (!post || !post.community || !post.community.equals(community._id)) {
      res.status(404).json({ message: 'Post not found in this community' });
      return;
    }

    const postAuthorId = post.author?.toString?.();
    const postTitle = post.title;

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    await AuditLog.create({
      actor: req.user._id,
      action: 'post_removed',
      targetType: 'post',
      targetId: postId,
      metadata: { communityId: community._id },
    });

    if (postAuthorId) {
      await createNotification({
        userId: postAuthorId,
        type: 'post-removed',
        title: 'Your post was removed',
        body: community.name
          ? `A moderator removed "${postTitle}" from ${community.name}.`
          : `A moderator removed your post "${postTitle}".`,
        metadata: {
          postId,
          communityId: community._id,
        },
      });
    }

    res.status(200).json({ message: 'Post removed' });
  } catch (error) {
    next(error as Error);
  }
};

export const removeComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier, commentId } = req.params as { identifier: string; commentId: string };
    if (!Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: 'Invalid comment id' });
      return;
    }

    const community = await Community.findOne(
      Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { slug: identifier.toLowerCase() },
    );

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const moderator = await ensureModerator(community._id, req.user._id);
    if (!moderator) {
      res.status(403).json({ message: 'Moderator permissions required' });
      return;
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const post = await Post.findById(comment.post);
    if (!post || !post.community || !post.community.equals(community._id)) {
      res.status(404).json({ message: 'Comment not found in this community' });
      return;
    }

    comment.isDeleted = true;
    comment.body = '';
    await comment.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'comment_removed',
      targetType: 'comment',
      targetId: commentId,
      metadata: { communityId: community._id },
    });

    res.status(200).json({ message: 'Comment removed' });
  } catch (error) {
    next(error as Error);
  }
};

export const banMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier, memberId } = req.params as { identifier: string; memberId: string };

    const community = await Community.findOne(
      Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { slug: identifier.toLowerCase() },
    );

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const moderator = await ensureModerator(community._id, req.user._id);
    if (!moderator) {
      res.status(403).json({ message: 'Moderator permissions required' });
      return;
    }

    const membership = await CommunityMember.findById(memberId);
    if (!membership || !membership.community.equals(community._id)) {
      res.status(404).json({ message: 'Membership not found' });
      return;
    }

    membership.status = 'banned';
    await membership.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'member_banned',
      targetType: 'membership',
      targetId: memberId,
      metadata: { communityId: community._id },
    });

    res.status(200).json({ message: 'Member banned' });
  } catch (error) {
    next(error as Error);
  }
};

export const unbanMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { identifier, memberId } = req.params as { identifier: string; memberId: string };

    const community = await Community.findOne(
      Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { slug: identifier.toLowerCase() },
    );

    if (!community) {
      res.status(404).json({ message: 'Community not found' });
      return;
    }

    const moderator = await ensureModerator(community._id, req.user._id);
    if (!moderator) {
      res.status(403).json({ message: 'Moderator permissions required' });
      return;
    }

    const membership = await CommunityMember.findById(memberId);
    if (!membership || !membership.community.equals(community._id)) {
      res.status(404).json({ message: 'Membership not found' });
      return;
    }

    membership.status = 'active';
    membership.joinedAt = new Date();
    await membership.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'member_unbanned',
      targetType: 'membership',
      targetId: memberId,
      metadata: { communityId: community._id },
    });

    res.status(200).json({ message: 'Member unbanned' });
  } catch (error) {
    next(error as Error);
  }
};
