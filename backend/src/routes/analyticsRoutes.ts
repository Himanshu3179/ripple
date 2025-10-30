import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getMyAnalytics } from '../controllers/analyticsController';

const router = Router();

router.get('/me', authMiddleware, getMyAnalytics);

export default router;
