import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { cancelScheduledPost, listScheduledPosts, schedulePost } from '../controllers/scheduleController';

const router = Router();

router.get('/', authMiddleware, listScheduledPosts);
router.post('/', authMiddleware, schedulePost);
router.post('/:scheduledId/cancel', authMiddleware, cancelScheduledPost);

export default router;
