const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const serializePost = (postDoc, viewerVote) => {
  const post = postDoc.toObject({ virtuals: true });
  return {
    id: post._id,
    title: post.title,
    body: post.body,
    topic: post.topic,
    imageUrl: post.imageUrl || '',
    commentCount: post.commentCount,
    score: post.upvotes.length - post.downvotes.length,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author && {
      id: post.author._id,
      username: post.author.username,
      displayName: post.author.displayName,
      avatarColor: post.author.avatarColor,
    },
    viewerVote: viewerVote !== undefined ? viewerVote : undefined,
  };
};

const createPost = async (req, res, next) => {
  try {
    const { title, body, topic, imageUrl } = req.body;

    if (!title || !topic) {
      return res.status(400).json({ message: 'Title and topic are required' });
    }

    const post = await Post.create({
      title: title.trim(),
      body: body || '',
      topic: topic.trim().toLowerCase(),
      imageUrl: imageUrl || '',
      author: req.user._id,
    });

    await post.populate('author', 'username displayName avatarColor');

    return res.status(201).json({ post: serializePost(post) });
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const { topic, author, sort = 'new', q } = req.query;
    const filter = {};

    if (topic) {
      filter.topic = topic.toLowerCase();
    }

    if (author && mongoose.Types.ObjectId.isValid(author)) {
      filter.author = author;
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
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    if (sort === 'top') {
      posts = posts.sort(
        (a, b) => b.upvotes.length - b.downvotes.length - (a.upvotes.length - a.downvotes.length),
      );
    } else if (sort === 'hot') {
      posts = posts.sort((a, b) => {
        const scoreA = a.upvotes.length - a.downvotes.length;
        const scoreB = b.upvotes.length - b.downvotes.length;
        const ageA = Date.now() - a.createdAt.getTime();
        const ageB = Date.now() - b.createdAt.getTime();
        const hotA = scoreA / Math.max(ageA / 3600000, 1);
        const hotB = scoreB / Math.max(ageB / 3600000, 1);
        return hotB - hotA;
      });
    }

    const viewerId = req.user?._id?.toString();
    const response = posts.map((post) => {
      let viewerVote;
      if (viewerId) {
        if (post.upvotes.some((id) => id.equals(viewerId))) {
          viewerVote = 1;
        } else if (post.downvotes.some((id) => id.equals(viewerId))) {
          viewerVote = -1;
        } else {
          viewerVote = 0;
        }
      }
      return serializePost(post, viewerVote);
    });

    return res.status(200).json({ posts: response });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(postId).populate('author', 'username displayName avatarColor');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const viewerId = req.user?._id?.toString();
    let viewerVote;
    if (viewerId) {
      if (post.upvotes.some((id) => id.equals(viewerId))) {
        viewerVote = 1;
      } else if (post.downvotes.some((id) => id.equals(viewerId))) {
        viewerVote = -1;
      } else {
        viewerVote = 0;
      }
    }

    return res.status(200).json({ post: serializePost(post, viewerVote) });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title, body, topic, imageUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'You cannot edit this post' });
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

    return res.status(200).json({ post: serializePost(post) });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'You cannot delete this post' });
    }

    await Comment.deleteMany({ post: postId });
    await post.deleteOne();

    return res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

const votePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { value } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    if (![1, 0, -1].includes(value)) {
      return res.status(400).json({ message: 'Vote value must be 1, 0, or -1' });
    }

    const post = await Post.findById(postId).populate('author', 'username displayName avatarColor');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.applyVote(req.user._id, value);
    await post.save();

    const viewerId = req.user._id.toString();
    let viewerVote = 0;
    if (post.upvotes.some((id) => id.equals(viewerId))) {
      viewerVote = 1;
    } else if (post.downvotes.some((id) => id.equals(viewerId))) {
      viewerVote = -1;
    }

    return res.status(200).json({ post: serializePost(post, viewerVote) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  votePost,
};
