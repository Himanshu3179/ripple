const express = require('express');
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  votePost,
} = require('../controllers/postController');
const { getCommentsForPost, addCommentToPost } = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router.get('/', optionalAuth, getPosts);
router.post('/', authMiddleware, createPost);
router.get('/:postId', optionalAuth, getPostById);
router.put('/:postId', authMiddleware, updatePost);
router.delete('/:postId', authMiddleware, deletePost);
router.post('/:postId/vote', authMiddleware, votePost);

router.get('/:postId/comments', optionalAuth, getCommentsForPost);
router.post('/:postId/comments', authMiddleware, addCommentToPost);

module.exports = router;
