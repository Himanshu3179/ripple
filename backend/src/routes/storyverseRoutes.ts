import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import optionalAuth from '../middleware/optionalAuth';
import rateLimit from '../middleware/rateLimit';
import { addScene, createStory, getStory, listStories } from '../controllers/storyverseController';

const router = Router();

const storyCreateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => `story-create:${req.user?._id?.toString() ?? req.ip ?? 'unknown'}`,
});

const sceneCreateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `story-scene:${req.user?._id?.toString() ?? req.ip ?? 'unknown'}`,
});

router.get('/', optionalAuth, listStories);
router.get('/:storyId', optionalAuth, getStory);
router.post('/', authMiddleware, storyCreateLimiter, createStory);
router.post('/:storyId/scenes', authMiddleware, sceneCreateLimiter, addScene);

export default router;
