import { Router } from 'express';
import {
  addCommentToPost,
  getCommentsForPost,
} from '../controllers/commentController';
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
  votePost,
} from '../controllers/postController';
import authMiddleware from '../middleware/auth';
import optionalAuth from '../middleware/optionalAuth';
import rateLimit from '../middleware/rateLimit';

const router = Router();

const createPostLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 4,
  keyGenerator: (req) => `create-post:${req.user?._id?.toString() ?? req.ip ?? 'unknown'}`,
});

const commentCreateLimit = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 6,
  keyGenerator: (req) => `create-comment:${req.user?._id?.toString() ?? req.ip ?? 'unknown'}`,
});

router.get('/', optionalAuth, getPosts);
router.post('/', authMiddleware, createPostLimit, createPost);
router.get('/:postId', optionalAuth, getPostById);
router.put('/:postId', authMiddleware, updatePost);
router.delete('/:postId', authMiddleware, deletePost);
router.post('/:postId/vote', authMiddleware, votePost);

router.get('/:postId/comments', optionalAuth, getCommentsForPost);
router.post('/:postId/comments', authMiddleware, commentCreateLimit, addCommentToPost);

export default router;
