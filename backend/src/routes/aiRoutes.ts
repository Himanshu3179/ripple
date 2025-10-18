import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { generatePost } from '../controllers/aiController';

const router = Router();

router.post('/compose', authMiddleware, generatePost);

export default router;
