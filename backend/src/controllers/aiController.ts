import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import { composePost } from '../services/aiComposerService';
import { adjustStars } from '../services/starService';
import { STARFORGE_EXTRA_DRAFT_COST } from '../config/economy';
import { recordMissionProgress } from '../services/missionService';

const ensureQuota = (limit: number, used: number) => {
  if (limit < 0) {
    return true;
  }
  return used < limit;
};

const resetQuotaIfNeeded = (user: typeof User.prototype) => {
  const quota = user.aiPostQuota;
  if (!quota) {
    return;
  }

  const now = new Date();
  if (quota.renewsAt <= now) {
    if (user.membershipTier === 'star-pass') {
      quota.limit = 60;
    } else if (user.membershipTier === 'star-unlimited') {
      quota.limit = -1;
    } else {
      quota.limit = 5;
    }
    quota.used = 0;
    const renew = new Date();
    renew.setUTCMonth(renew.getUTCMonth() + 1);
    quota.renewsAt = renew;
  }
};

export const generatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { prompt, tone, outline } = req.body as {
      prompt?: string;
      tone?: string;
      outline?: string[];
    };

    if (!prompt || prompt.trim().length < 10) {
      res.status(400).json({ message: 'Prompt must be at least 10 characters' });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    resetQuotaIfNeeded(user);

    const quota = user.aiPostQuota || {
      limit: user.membershipTier === 'star-pass' ? 60 : user.membershipTier === 'star-unlimited' ? -1 : 5,
      used: 0,
      renewsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    };

    let usedStars = false;
    if (!ensureQuota(quota.limit, quota.used)) {
      if ((user.starsBalance ?? 0) < STARFORGE_EXTRA_DRAFT_COST) {
        res.status(402).json({
          message: 'AI quota exceeded. Upgrade to a Star Pass or purchase more Stars.',
        });
        return;
      }
      const updated = await adjustStars(
        user._id.toString(),
        -STARFORGE_EXTRA_DRAFT_COST,
        'ai-draft',
        undefined,
        { promptPreview: prompt.slice(0, 60) },
      );
      user.starsBalance = updated.starsBalance;
      usedStars = true;
    }

    const result = await composePost({
      prompt: prompt.trim(),
      tone,
      outline,
    });

    if (!usedStars) {
      quota.used += 1;
    }
    user.aiPostQuota = quota;
    await user.save();

    await recordMissionProgress(user._id.toString(), 'starforge');

    res.status(200).json({
      title: result.title,
      body: result.body,
      topic: result.topic,
      remainingQuota: quota.limit < 0 ? null : Math.max(quota.limit - quota.used, 0),
      renewsAt: quota.renewsAt,
    });
  } catch (error) {
    next(error as Error);
  }
};
