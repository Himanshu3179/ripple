import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import Comment, { ICommentDocument } from '../models/Comment';
import Post from '../models/Post';
import { isCommunityAccessible, loadMembershipMap, toCommunitySummary } from '../services/communityAccess';
import CommunitySettings from '../models/CommunitySettings';
import { recordMissionProgress } from '../services/missionService';
import { checkSpamSubmission } from '../services/spamService';

interface SerializedAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarColor?: string;
}

export interface SerializedComment {
  id: string;
  postId: string;
  body: string;
  isDeleted: boolean;
  parentComment: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  score: number;
  author: SerializedAuthor | null;
  viewerVote?: number;
  replies: SerializedComment[];
}

type VoteValue = 1 | 0 | -1;

const formatAuthor = (author: SerializedAuthor | null | undefined): SerializedAuthor | null => {
  if (!author) return null;
  return {
    id: author.id,
    username: author.username,
    displayName: author.displayName,
    avatarColor: author.avatarColor,
  };
};

const determineViewerVote = (
  comment: ICommentDocument,
  viewerId?: string,
): number | undefined => {
  if (!viewerId || !Types.ObjectId.isValid(viewerId)) {
    return undefined;
  }

  const viewerObjectId = new Types.ObjectId(viewerId);

  if (comment.upvotes.some((id) => id.equals(viewerObjectId))) {
    return 1;
  }

  if (comment.downvotes.some((id) => id.equals(viewerObjectId))) {
    return -1;
  }

  return 0;
};

const formatComment = (
  commentDoc: ICommentDocument,
  viewerId?: string,
): SerializedComment => {
  const viewerVote = determineViewerVote(commentDoc, viewerId);
  const comment = commentDoc.toObject({ virtuals: true });

  const author = comment.isDeleted
    ? null
    : formatAuthor(
        comment.author && {
          id: comment.author._id.toString(),
          username: comment.author.username,
          displayName: comment.author.displayName,
          avatarColor: comment.author.avatarColor,
        },
      );

  return {
    id: comment._id.toString(),
    postId: comment.post.toString(),
    body: comment.isDeleted ? '[deleted]' : comment.body,
    isDeleted: comment.isDeleted,
    parentComment: comment.parentComment ? comment.parentComment.toString() : null,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    score: (comment.upvotes?.length || 0) - (comment.downvotes?.length || 0),
    author,
    viewerVote,
    replies: [],
  };
};

const buildCommentTree = (comments: ICommentDocument[], viewerId?: string): SerializedComment[] => {
  const map = new Map<string, SerializedComment>();
  const roots: SerializedComment[] = [];

  comments.forEach((commentDoc) => {
    const formatted = formatComment(commentDoc, viewerId);
    map.set(formatted.id, formatted);
  });

  comments.forEach((commentDoc) => {
    const formatted = map.get(commentDoc._id.toString());
    const parentId = commentDoc.parentComment?.toString();

    if (!formatted) {
      return;
    }

    if (parentId && map.has(parentId)) {
      map.get(parentId)?.replies.push(formatted);
    } else {
      roots.push(formatted);
    }
  });

  return roots;
};

const verifyPostAccess = async (postId: string, viewerId?: string) => {
  if (!Types.ObjectId.isValid(postId)) {
    return { error: 'invalid' as const };
  }

  const post = await Post.findById(postId).populate('community', 'name slug visibility');

  if (!post) {
    return { error: 'not-found' as const };
  }

  const summary = toCommunitySummary(post.community);
  const membershipMap = await loadMembershipMap(
    summary ? [summary._id.toString()] : [],
    viewerId,
  );

  if (!isCommunityAccessible(summary, membershipMap, viewerId)) {
    return { error: 'forbidden' as const };
  }

  return { post };
};

export const getCommentsForPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;

    if (!Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: 'Invalid post id' });
      return;
    }

    const access = await verifyPostAccess(postId, req.user?._id?.toString());

    if ('error' in access) {
      if (access.error === 'invalid') {
        res.status(400).json({ message: 'Invalid post id' });
      } else if (access.error === 'not-found') {
        res.status(404).json({ message: 'Post not found' });
      } else {
        res.status(403).json({ message: 'You do not have access to this post' });
      }
      return;
    }

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username displayName avatarColor')
      .sort({ createdAt: 1 })
      .exec();

    const viewerId = req.user?._id?.toString();
    const tree = buildCommentTree(comments, viewerId);

    res.status(200).json({ comments: tree });
  } catch (error) {
    next(error as Error);
  }
};

export const addCommentToPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { postId } = req.params;
    const { body, parentId } = req.body as { body?: string; parentId?: string | null };

    if (!body || !body.trim()) {
      res.status(400).json({ message: 'Comment body is required' });
      return;
    }

    const access = await verifyPostAccess(postId, req.user._id.toString());

    if ('error' in access) {
      if (access.error === 'invalid') {
        res.status(400).json({ message: 'Invalid post id' });
      } else if (access.error === 'not-found') {
        res.status(404).json({ message: 'Post not found' });
      } else {
        res.status(403).json({ message: 'You do not have access to this post' });
      }
      return;
    }

    const spamCheck = checkSpamSubmission({
      type: 'comment',
      userId: req.user._id.toString(),
      content: body,
    });

    if (!spamCheck.allowed) {
      res.status(429).json({ message: spamCheck.message });
      return;
    }

    let ancestors: Types.ObjectId[] = [];

    if (parentId) {
      if (!Types.ObjectId.isValid(parentId)) {
        res.status(400).json({ message: 'Invalid parent comment id' });
        return;
      }

      const parentComment = await Comment.findById(parentId);

      if (!parentComment) {
        res.status(404).json({ message: 'Parent comment not found' });
        return;
      }

      if (parentComment.post.toString() !== postId) {
        res.status(400).json({ message: 'Parent comment does not belong to this post' });
        return;
      }

      ancestors = [...parentComment.ancestors, parentComment._id];
    }

    const settings = await CommunitySettings.findOne({ community: access.post.community }).lean();
    const text = body.trim();
    if (settings?.bannedKeywords?.length) {
      if (settings.bannedKeywords.some((word) => text.toLowerCase().includes(word.toLowerCase()))) {
        res.status(400).json({ message: 'Comment contains banned keywords' });
        return;
      }
    }

    const comment = await Comment.create({
      post: new Types.ObjectId(postId),
      author: req.user._id,
      body: text,
      parentComment: parentId ? new Types.ObjectId(parentId) : null,
      ancestors,
      isDeleted: false,
      upvotes: [],
      downvotes: [],
    });

    await comment.populate('author', 'username displayName avatarColor');
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } }).exec();

    await recordMissionProgress(req.user._id.toString(), 'comment');

    res
      .status(201)
      .json({ comment: formatComment(comment, req.user._id.toString()) });
  } catch (error) {
    next(error as Error);
  }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { commentId } = req.params;
    const { body } = req.body as { body?: string };

    if (!Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: 'Invalid comment id' });
      return;
    }

    const comment = await Comment.findById(commentId).populate(
      'author',
      'username displayName avatarColor',
    );

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const access = await verifyPostAccess(comment.post.toString(), req.user._id.toString());
    if ('error' in access) {
      if (access.error === 'forbidden') {
        res.status(403).json({ message: 'You do not have access to this post' });
      } else if (access.error === 'not-found') {
        res.status(404).json({ message: 'Post not found' });
      } else {
        res.status(400).json({ message: 'Invalid post id' });
      }
      return;
    }

    if (!comment.author || !comment.author._id.equals(req.user._id)) {
      res.status(403).json({ message: 'You cannot edit this comment' });
      return;
    }

    if (comment.isDeleted) {
      res.status(400).json({ message: 'Cannot edit a deleted comment' });
      return;
    }

    if (!body || !body.trim()) {
      res.status(400).json({ message: 'Comment body is required' });
      return;
    }

    comment.body = body.trim();
    await comment.save();

    res
      .status(200)
      .json({ comment: formatComment(comment, req.user._id.toString()) });
  } catch (error) {
    next(error as Error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { commentId } = req.params;

    if (!Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: 'Invalid comment id' });
      return;
    }

    const comment = await Comment.findById(commentId).populate(
      'author',
      'username displayName avatarColor',
    );

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const access = await verifyPostAccess(comment.post.toString(), req.user._id.toString());
    if ('error' in access) {
      if (access.error === 'forbidden') {
        res.status(403).json({ message: 'You do not have access to this post' });
      } else if (access.error === 'not-found') {
        res.status(404).json({ message: 'Post not found' });
      } else {
        res.status(400).json({ message: 'Invalid post id' });
      }
      return;
    }

    if (!comment.author || !comment.author._id.equals(req.user._id)) {
      res.status(403).json({ message: 'You cannot delete this comment' });
      return;
    }

    if (comment.isDeleted) {
      res
        .status(200)
        .json({ comment: formatComment(comment, req.user._id.toString()) });
      return;
    }

    comment.isDeleted = true;
    comment.body = '';
    await comment.save();

    res
      .status(200)
      .json({ comment: formatComment(comment, req.user._id.toString()) });
  } catch (error) {
    next(error as Error);
  }
};

export const voteOnComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { commentId } = req.params;
    const { value } = req.body as { value: VoteValue };

    if (!Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: 'Invalid comment id' });
      return;
    }

    if (![1, 0, -1].includes(value)) {
      res.status(400).json({ message: 'Vote value must be 1, 0, or -1' });
      return;
    }

    const comment = await Comment.findById(commentId).populate(
      'author',
      'username displayName avatarColor',
    );

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const access = await verifyPostAccess(comment.post.toString(), req.user._id.toString());
    if ('error' in access) {
      if (access.error === 'forbidden') {
        res.status(403).json({ message: 'You do not have access to this post' });
      } else if (access.error === 'not-found') {
        res.status(404).json({ message: 'Post not found' });
      } else {
        res.status(400).json({ message: 'Invalid post id' });
      }
      return;
    }

    comment.applyVote(req.user._id, value);
    await comment.save();

    res
      .status(200)
      .json({ comment: formatComment(comment, req.user._id.toString()) });
  } catch (error) {
    next(error as Error);
  }
};
