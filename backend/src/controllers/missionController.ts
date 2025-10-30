import { NextFunction, Request, Response } from 'express';
import { claimMission, getLeaderboard, listUserMissions } from '../services/missionService';

export const getMissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const missions = await listUserMissions(req.user._id.toString());
    res.status(200).json({ missions });
  } catch (error) {
    next(error as Error);
  }
};

export const claimMissionReward = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { missionId } = req.params;
    const result = await claimMission(req.user._id.toString(), missionId);
    res.status(200).json({ message: 'Reward claimed', starsBalance: result.starsBalance, mission: result.mission });
  } catch (error) {
    next(error as Error);
  }
};

export const getGlobalLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'missions' } = req.query as { type?: 'missions' | 'referrals' | 'stars-earned' };
    const entries = await getLeaderboard(type);
    res.status(200).json({ type, entries });
  } catch (error) {
    next(error as Error);
  }
};
