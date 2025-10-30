import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { claimMissionReward, getGlobalLeaderboard, getMissions } from '../controllers/missionController';

const router = Router();

router.get('/', authMiddleware, getMissions);
router.post('/:missionId/claim', authMiddleware, claimMissionReward);
router.get('/leaderboard/global', getGlobalLeaderboard);

export default router;
