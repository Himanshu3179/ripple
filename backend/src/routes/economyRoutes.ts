import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { boostPost, getLedger, sendTip } from '../controllers/economyController';

const router = Router();

router.get('/ledger', authMiddleware, getLedger);
router.post('/tip', authMiddleware, sendTip);
router.post('/posts/:postId/boost', authMiddleware, boostPost);

export default router;
