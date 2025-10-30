import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import Post, { IPostDocument } from '../models/Post';
import Comment from '../models/Comment';
import Community, { ICommunityDocument } from '../models/Community';
import {
  ensureActiveMembership,
  isCommunityAccessible,
  loadMembershipMap,
  toCommunitySummary,
  CommunitySummary,
} from '../services/communityAccess';
import CommunitySettings from '../models/CommunitySettings';
import { recordMissionProgress } from '../services/missionService';
import { checkSpamSubmission } from '../services/spamService';

interface SerializedAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarColor?: string;
}

export interface SerializedPost {
  id: string;
  title: string;
  body: string;
  topic: string;
  imageUrl: string;
  commentCount: number;
  score: number;
  boostScore: number;
  boostedUntil: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  author: SerializedAuthor | null;
  community: {
    id: string;
    name: string;
    slug: string;
    visibility: string;
  } | null;
  viewerVote?: number;
}

type VoteValue = 1 | 0 | -1;

const determineViewerVote = (
  doc: { upvotes: Types.ObjectId[]; downvotes: Types.ObjectId[] },
  viewerId?: string,
): number | undefined => {
  if (!viewerId) {
    return undefined;
  }

  const viewerObjectId = new Types.ObjectId(viewerId);

  if (doc.upvotes.some((id) => id.equals(viewerObjectId))) {
    return 1;
  }

  if (doc.downvotes.some((id) => id.equals(viewerObjectId))) {
    return -1;
  }

  return 0;
};

const serializePost = (postDoc: IPostDocument, viewerVote?: number): SerializedPost => {
  const post = postDoc.toObject({ virtuals: true });

  return {
    id: post._id.toString(),
    title: post.title,
    body: post.body,
    topic: post.topic,
    imageUrl: post.imageUrl || '',
    commentCount: post.commentCount,
    score: post.upvotes.length - post.downvotes.length,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    boostScore: post.boostScore || 0,
    boostedUntil: post.boostedUntil || null,
    author: post.author
      ? {
          id: post.author._id.toString(),
          username: post.author.username,
          displayName: post.author.displayName,
          avatarColor: post.author.avatarColor,
        }
      : null,
    community: post.community
      ? {
          id: post.community._id.toString(),
          name: post.community.name,
          slug: post.community.slug,
          visibility: post.community.visibility,
        }
      : null,
    viewerVote,
  };
};

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { title, body, topic, imageUrl, communityId } = req.body as Record<string, string>;

    if (!title || !topic) {
      res.status(400).json({ message: 'Title and topic are required' });
      return;
    }

    let community: ICommunityDocument | null = null;
    if (communityId) {
      const query = Types.ObjectId.isValid(communityId)
        ? { _id: communityId }
        : { slug: communityId.toLowerCase() };
      community = await Community.findOne(query);

      if (!community) {
        res.status(404).json({ message: 'Community not found' });
        return;
      }

      const membership = await ensureActiveMembership(community._id, req.user._id);

      if (!membership) {
        res.status(403).json({ message: 'You must be an active member to post here' });
        return;
      }

      const settings = await CommunitySettings.findOne({ community: community._id }).lean();
      if (settings?.bannedKeywords?.length) {
        const normalized = `${title} ${body}`.toLowerCase();
        if (settings.bannedKeywords.some((word) => normalized.includes(word.toLowerCase()))) {
          res.status(400).json({ message: 'Post contains banned keywords for this community' });
          return;
        }
      }
    }

    const spamCheck = checkSpamSubmission({
      type: 'post',
      userId: req.user._id.toString(),
      content: `${title} ${body ?? ''}`,
    });

    if (!spamCheck.allowed) {
      res.status(429).json({ message: spamCheck.message });
      return;
    }

    const post = await Post.create({
      title: title.trim(),
      body: body || '',
      topic: topic.trim().toLowerCase(),
      imageUrl: imageUrl || '',
      author: req.user._id,
      community: community ? community._id : null,
    });

    await post.populate('author', 'username displayName avatarColor');
    await post.populate('community', 'name slug visibility');

    await recordMissionProgress(req.user._id.toString(), 'post');

    res.status(201).json({ post: serializePost(post, 0) });
  } catch (error) {
    next(error as Error);
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, author, sort = 'new', q, community: communityParam } =
      req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    let targetCommunity: ICommunityDocument | null = null;

    if (topic) {
      filter.topic = topic.toLowerCase();
    }

    if (author && Types.ObjectId.isValid(author)) {
      filter.author = author;
    }

    if (communityParam) {
      const query = Types.ObjectId.isValid(communityParam)
        ? { _id: communityParam }
        : { slug: communityParam.toLowerCase() };
      targetCommunity = await Community.findOne(query);

      if (!targetCommunity) {
        res.status(404).json({ message: 'Community not found' });
        return;
      }

      filter.community = targetCommunity._id;
    }

    const searchTerm = q?.trim();
    if (searchTerm) {
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { body: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    let posts = await Post.find(filter)
      .populate('author', 'username displayName avatarColor')
      .populate('community', 'name slug visibility')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const now = new Date();
    posts = posts.map((post) => {
      if (post.boostedUntil && post.boostedUntil < now) {
        post.boostedUntil = null;
        post.boostScore = 0;
      }
      return post;
    });

    if (sort === 'top') {
      posts = posts.sort(
        (a, b) => b.upvotes.length - b.downvotes.length - (a.upvotes.length - a.downvotes.length),
      );
    } else if (sort === 'hot') {
      posts = posts.sort((a, b) => {
        const scoreA = a.upvotes.length - a.downvotes.length;
        const scoreB = b.upvotes.length - b.downvotes.length;
        const createdAtA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const createdAtB = b.createdAt instanceof Date ? b.createdAt : new Date();
        const ageA = Date.now() - createdAtA.getTime();
        const ageB = Date.now() - createdAtB.getTime();
        const hotA = scoreA / Math.max(ageA / 3_600_000, 1);
        const hotB = scoreB / Math.max(ageB / 3_600_000, 1);
        return hotB - hotA;
      });
    }

    const viewerId = req.user?._id?.toString();

    const communityIds = posts
      .map((post) => toCommunitySummary(post.community))
      .filter((summary): summary is CommunitySummary => Boolean(summary))
      .map((summary) => summary._id.toString());

    const membershipMap = await loadMembershipMap(Array.from(new Set(communityIds)), viewerId);

    const targetCommunitySummary = toCommunitySummary(targetCommunity);
    if (targetCommunitySummary) {
      if (!isCommunityAccessible(targetCommunitySummary, membershipMap, viewerId)) {
        res.status(403).json({ message: 'You do not have access to this community' });
        return;
      }
    }

    posts = posts.filter((post) =>
      isCommunityAccessible(toCommunitySummary(post.community), membershipMap, viewerId),
    );

    posts = posts.sort((a, b) => {
      const boostA = a.boostedUntil && a.boostedUntil > now ? a.boostScore ?? 0 : 0;
      const boostB = b.boostedUntil && b.boostedUntil > now ? b.boostScore ?? 0 : 0;
      if (boostB !== boostA) return boostB - boostA;
      return 0;
    });

    const response = posts.map((post) => serializePost(post, determineViewerVote(post, viewerId)));

    res.status(200).json({ posts: response });
  } catch (error) {
    next(error as Error);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;

    if (!Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: 'Invalid post id' });
      return;
    }

    const post = await Post.findById(postId)
      .populate('author', 'username displayName avatarColor')
      .populate('community', 'name slug visibility');

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const viewerId = req.user?._id?.toString();
    const communitySummary = toCommunitySummary(post.community);
    const membershipMap = await loadMembershipMap(
      communitySummary ? [communitySummary._id.toString()] : [],
      viewerId,
    );

    if (!isCommunityAccessible(communitySummary, membershipMap, viewerId)) {
      res.status(403).json({ message: 'You do not have access to this post' });
      return;
    }

    const viewerVote = determineViewerVote(post, viewerId);

    res.status(200).json({ post: serializePost(post, viewerVote) });
  } catch (error) {
    next(error as Error);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { postId } = req.params;
    const { title, body, topic, imageUrl } = req.body as Record<string, string>;

    if (!Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: 'Invalid post id' });
      return;
    }

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (!post.author.equals(req.user._id)) {
      res.status(403).json({ message: 'You cannot edit this post' });
      return;
    }

    if (title) {
      post.title = title.trim();
    }
    if (body !== undefined) {
      post.body = body;
    }
    if (topic) {
      post.topic = topic.trim().toLowerCase();
    }
    if (imageUrl !== undefined) {
      post.imageUrl = imageUrl;
    }

    await post.save();
    await post.populate('author', 'username displayName avatarColor');
    await post.populate('community', 'name slug visibility');

    res.status(200).json({ post: serializePost(post) });
  } catch (error) {
    next(error as Error);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { postId } = req.params;

    if (!Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: 'Invalid post id' });
      return;
    }

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (!post.author.equals(req.user._id)) {
      res.status(403).json({ message: 'You cannot delete this post' });
      return;
    }

    await Comment.deleteMany({ post: postId });
    await post.deleteOne();

    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    next(error as Error);
  }
};

export const votePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { postId } = req.params;
    const { value } = req.body as { value: VoteValue };

    if (!Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: 'Invalid post id' });
      return;
    }

    if (![1, 0, -1].includes(value)) {
      res.status(400).json({ message: 'Vote value must be 1, 0, or -1' });
      return;
    }

    const post = await Post.findById(postId)
      .populate('author', 'username displayName avatarColor')
      .populate('community', 'name slug visibility');

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const membershipMap = await loadMembershipMap(
      post.community ? [post.community._id.toString()] : [],
      req.user._id.toString(),
    );
    if (!isCommunityAccessible(toCommunitySummary(post.community), membershipMap, req.user._id.toString())) {
      res.status(403).json({ message: 'You do not have access to interact with this post' });
      return;
    }

    post.applyVote(req.user._id, value);
    await post.save();

    const viewerVote = determineViewerVote(post, req.user._id.toString());

    res.status(200).json({ post: serializePost(post, viewerVote) });
  } catch (error) {
    next(error as Error);
  }
};
