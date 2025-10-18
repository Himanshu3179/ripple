const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

const formatAuthor = (author) => {
  if (!author) return null;
  return {
    id: author._id,
    username: author.username,
    displayName: author.displayName,
    avatarColor: author.avatarColor,
  };
};

const formatComment = (commentDoc, viewerId) => {
  const upvotes = commentDoc.upvotes || [];
  const downvotes = commentDoc.downvotes || [];
  let viewerVote;

  if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
    const viewerObjectId = new mongoose.Types.ObjectId(viewerId);
    if (upvotes.some((id) => id.equals(viewerObjectId))) {
      viewerVote = 1;
    } else if (downvotes.some((id) => id.equals(viewerObjectId))) {
      viewerVote = -1;
    } else {
      viewerVote = 0;
    }
  }

  const comment = commentDoc.toObject({ virtuals: true });

  return {
    id: comment._id,
    postId: comment.post,
    body: comment.isDeleted ? '[deleted]' : comment.body,
    isDeleted: comment.isDeleted,
    parentComment: comment.parentComment,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    score: upvotes.length - downvotes.length,
    author: comment.isDeleted ? null : formatAuthor(comment.author),
    viewerVote,
    replies: [],
  };
};

const buildCommentTree = (comments, viewerId) => {
  const map = new Map();
  const roots = [];

  comments.forEach((commentDoc) => {
    const formatted = formatComment(commentDoc, viewerId);
    map.set(formatted.id.toString(), formatted);
  });

  comments.forEach((commentDoc) => {
    const formatted = map.get(commentDoc._id.toString());
    const parentId = commentDoc.parentComment?.toString();

    if (parentId && map.has(parentId)) {
      map.get(parentId).replies.push(formatted);
    } else {
      roots.push(formatted);
    }
  });

  return roots;
};

const getCommentsForPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username displayName avatarColor')
      .sort({ createdAt: 1 })
      .exec();

    const viewerId = req.user?._id?.toString();
    const tree = buildCommentTree(comments, viewerId);

    return res.status(200).json({ comments: tree });
  } catch (error) {
    next(error);
  }
};

const addCommentToPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { body, parentId } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Comment body is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    let ancestors = [];

    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ message: 'Invalid parent comment id' });
      }

      const parentComment = await Comment.findById(parentId);

      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }

      if (parentComment.post.toString() !== postId) {
        return res.status(400).json({ message: 'Parent comment does not belong to this post' });
      }

      ancestors = [...parentComment.ancestors, parentComment._id];
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      body: body.trim(),
      parentComment: parentId || null,
      ancestors,
    });

    await comment.populate('author', 'username displayName avatarColor');
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } }).exec();

    return res.status(201).json({ comment: formatComment(comment, req.user._id.toString()) });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { body } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    const comment = await Comment.findById(commentId).populate('author', 'username displayName avatarColor');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!comment.author._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'You cannot edit this comment' });
    }

    if (comment.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit a deleted comment' });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Comment body is required' });
    }

    comment.body = body.trim();
    await comment.save();

    return res.status(200).json({ comment: formatComment(comment, req.user._id.toString()) });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    const comment = await Comment.findById(commentId).populate('author', 'username displayName avatarColor');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!comment.author._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'You cannot delete this comment' });
    }

    if (comment.isDeleted) {
      return res.status(200).json({ comment: formatComment(comment, req.user._id.toString()) });
    }

    comment.isDeleted = true;
    comment.body = '';
    await comment.save();

    return res.status(200).json({ comment: formatComment(comment, req.user._id.toString()) });
  } catch (error) {
    next(error);
  }
};

const voteOnComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { value } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment id' });
    }

    if (![1, 0, -1].includes(value)) {
      return res.status(400).json({ message: 'Vote value must be 1, 0, or -1' });
    }

    const comment = await Comment.findById(commentId).populate('author', 'username displayName avatarColor');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.applyVote(req.user._id, value);
    await comment.save();

    return res.status(200).json({ comment: formatComment(comment, req.user._id.toString()) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommentsForPost,
  addCommentToPost,
  updateComment,
  deleteComment,
  voteOnComment,
};
