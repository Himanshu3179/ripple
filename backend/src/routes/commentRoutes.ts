import { Router } from 'express';
import {
  deleteComment,
  updateComment,
  voteOnComment,
} from '../controllers/commentController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.put('/:commentId', authMiddleware, updateComment);
router.delete('/:commentId', authMiddleware, deleteComment);
router.post('/:commentId/vote', authMiddleware, voteOnComment);

export default router;
