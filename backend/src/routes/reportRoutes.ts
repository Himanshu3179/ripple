import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import rateLimit from '../middleware/rateLimit';
import { createReport } from '../controllers/reportController';

const router = Router();

router.post(
  '/',
  authMiddleware,
  rateLimit({ windowMs: 60_000, max: 5, keyGenerator: (req) => `report:${req.user?._id ?? req.ip}` }),
  createReport,
);

export default router;
