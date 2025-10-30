import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import {
  createCommunity,
  createInvite,
  getCommunity,
  joinCommunity,
  leaveCommunity,
  listCommunities,
  listMembers,
  reviewMembership,
  updateCommunity,
} from '../controllers/communityController';
import {
  banMember,
  removeComment,
  removePost,
  unbanMember,
  updateCommunitySettings,
} from '../controllers/communityModerationController';

const router = Router();

router.get('/', authMiddleware, listCommunities);
router.post('/', authMiddleware, createCommunity);
router.get('/:identifier', authMiddleware, getCommunity);
router.put('/:identifier', authMiddleware, updateCommunity);
router.post('/:identifier/join', authMiddleware, joinCommunity);
router.post('/:identifier/leave', authMiddleware, leaveCommunity);
router.get('/:identifier/members', authMiddleware, listMembers);
router.post('/:identifier/members/:memberId/review', authMiddleware, reviewMembership);
router.post('/:identifier/invites', authMiddleware, createInvite);
router.put('/:identifier/mod/settings', authMiddleware, updateCommunitySettings);
router.post('/:identifier/mod/posts/:postId/remove', authMiddleware, removePost);
router.post('/:identifier/mod/comments/:commentId/remove', authMiddleware, removeComment);
router.post('/:identifier/mod/members/:memberId/ban', authMiddleware, banMember);
router.post('/:identifier/mod/members/:memberId/unban', authMiddleware, unbanMember);

export default router;
