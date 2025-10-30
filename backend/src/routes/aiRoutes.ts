import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { generatePost } from '../controllers/aiController';
import rateLimit from '../middleware/rateLimit';

const router = Router();

const aiComposeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `ai-compose:${req.user?._id?.toString() ?? req.ip ?? 'unknown'}`,
});

router.post('/compose', authMiddleware, aiComposeLimiter, generatePost);

export default router;
