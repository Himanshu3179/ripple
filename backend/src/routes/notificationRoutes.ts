import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { listNotifications, markAll, markNotification } from '../controllers/notificationController';

const router = Router();

router.get('/', authMiddleware, listNotifications);
router.post('/read-all', authMiddleware, markAll);
router.post('/:notificationId/read', authMiddleware, markNotification);

export default router;
