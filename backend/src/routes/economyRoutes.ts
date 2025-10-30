import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { boostPost, getLedger, sendTip } from '../controllers/economyController';
import rateLimit from '../middleware/rateLimit';

const router = Router();

const tipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => `tip:${req.user?._id?.toString() ?? req.ip ?? 'unknown'}`,
});

const boostLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => `boost:${req.user?._id?.toString() ?? req.ip ?? 'unknown'}`,
});

router.get('/ledger', authMiddleware, getLedger);
router.post('/tip', authMiddleware, tipLimiter, sendTip);
router.post('/posts/:postId/boost', authMiddleware, boostLimiter, boostPost);

export default router;
