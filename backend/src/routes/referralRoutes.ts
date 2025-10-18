import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { claimReferralRewards, getReferralDashboard } from '../controllers/referralController';

const router = Router();

router.get('/dashboard', authMiddleware, getReferralDashboard);
router.post('/claim', authMiddleware, claimReferralRewards);

export default router;
