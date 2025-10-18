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

const router = Router();

router.get('/', optionalAuth, getPosts);
router.post('/', authMiddleware, createPost);
router.get('/:postId', optionalAuth, getPostById);
router.put('/:postId', authMiddleware, updatePost);
router.delete('/:postId', authMiddleware, deletePost);
router.post('/:postId/vote', authMiddleware, votePost);

router.get('/:postId/comments', optionalAuth, getCommentsForPost);
router.post('/:postId/comments', authMiddleware, addCommentToPost);

export default router;
