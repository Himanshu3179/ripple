import { Router } from 'express';
import { getCurrentUser, login, logout, register } from '../controllers/authController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
