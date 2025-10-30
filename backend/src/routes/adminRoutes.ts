import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import adminMiddleware from '../middleware/admin';
import { listAuditLogs, listReports, updateReportStatus } from '../controllers/reportController';
import {
  listUsers,
  updateUserRole,
  listCommunities,
  updateCommunityVisibility,
} from '../controllers/adminController';

const router = Router();

router.get('/reports', authMiddleware, adminMiddleware, listReports);
router.post('/reports/:reportId/status', authMiddleware, adminMiddleware, updateReportStatus);
router.get('/audit-logs', authMiddleware, adminMiddleware, listAuditLogs);
router.get('/users', authMiddleware, adminMiddleware, listUsers);
router.post('/users/:userId/role', authMiddleware, adminMiddleware, updateUserRole);
router.get('/communities', authMiddleware, adminMiddleware, listCommunities);
router.post(
  '/communities/:communityId/visibility',
  authMiddleware,
  adminMiddleware,
  updateCommunityVisibility,
);

export default router;
