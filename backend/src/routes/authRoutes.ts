import { Router } from 'express';
import { getCurrentUser, login, logout, register } from '../controllers/authController';
import authMiddleware from '../middleware/auth';
import rateLimit from '../middleware/rateLimit';

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `register:${req.ip ?? 'unknown'}`,
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `login:${req.ip ?? 'unknown'}:${req.body?.identifier ?? ''}`,
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
