import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import ReferralLedger from '../models/ReferralLedger';
import { generateReferralCode } from '../utils/referralCode';

const SIGNUP_REWARD = 50;
const SUBSCRIPTION_REWARD = 200;

export const getReferralDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.referral?.code) {
      user.referral = {
        code: generateReferralCode(),
        invitedCount: 0,
        rewardsClaimed: 0,
      };
      await user.save();
    }

    const ledger = await ReferralLedger.find({ referrer: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      code: user.referral?.code,
      invitedCount: user.referral?.invitedCount ?? 0,
      rewardsClaimed: user.referral?.rewardsClaimed ?? 0,
      ledger,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const claimReferralRewards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const pendingRewards = await ReferralLedger.find({
      referrer: user._id,
      claimed: false,
    });

    if (pendingRewards.length === 0) {
      res.status(400).json({ message: 'No pending rewards' });
      return;
    }

    const totalStars = pendingRewards.reduce((sum, entry) => sum + entry.rewardStars, 0);
    pendingRewards.forEach((entry) => {
      entry.claimed = true;
    });
    await Promise.all(pendingRewards.map((entry) => entry.save()));

    user.starsBalance = (user.starsBalance ?? 0) + totalStars;
    user.referral = user.referral || { code: generateReferralCode(), invitedCount: 0, rewardsClaimed: 0 };
    user.referral.rewardsClaimed = (user.referral.rewardsClaimed ?? 0) + pendingRewards.length;
    await user.save();

    res.status(200).json({
      message: 'Rewards claimed',
      starsBalance: user.starsBalance,
      claimedRewards: pendingRewards.length,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const recordSubscriptionReferral = async (referrerId: string, inviteeId: string) => {
  await ReferralLedger.create({
    referrer: referrerId,
    invitee: inviteeId,
    rewardStars: SUBSCRIPTION_REWARD,
    rewardType: 'subscription',
  });
};

export const recordSignupReferral = async (referrerId: string, inviteeId?: string, inviteeEmail?: string) => {
  await ReferralLedger.create({
    referrer: referrerId,
    invitee: inviteeId,
    inviteeEmail,
    rewardStars: SIGNUP_REWARD,
    rewardType: 'signup',
  });
};
