import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import ReferralLedger from '../models/ReferralLedger';
import { generateReferralCode } from '../utils/referralCode';
import { recordReferralMission } from '../services/missionService';
import { adjustStars } from '../services/starService';
import { createNotification } from '../services/notificationService';

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

    const updated = await adjustStars(
      user._id.toString(),
      totalStars,
      'referral',
      'referral-claim',
    );
    user.referral = user.referral || { code: generateReferralCode(), invitedCount: 0, rewardsClaimed: 0 };
    user.referral.rewardsClaimed = (user.referral.rewardsClaimed ?? 0) + pendingRewards.length;
    user.starsBalance = updated.starsBalance;
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
  const ledgerEntry = await ReferralLedger.create({
    referrer: referrerId,
    invitee: inviteeId,
    rewardStars: SUBSCRIPTION_REWARD,
    rewardType: 'subscription',
  });
  await recordReferralMission(referrerId);

  const invitee = await User.findById(inviteeId).select('displayName username').lean();

  await createNotification({
    userId: referrerId,
    type: 'referral-subscription',
    title: 'Referral unlocked a bonus',
    body: invitee
      ? `${invitee.displayName ?? invitee.username} upgraded their membership. Claim ${SUBSCRIPTION_REWARD} bonus Stars!`
      : `One of your referrals upgraded their membership. Claim ${SUBSCRIPTION_REWARD} bonus Stars!`,
    metadata: {
      ledgerId: ledgerEntry._id,
      inviteeId,
    },
  });
};

export const recordSignupReferral = async (referrerId: string, inviteeId?: string, inviteeEmail?: string) => {
  const ledgerEntry = await ReferralLedger.create({
    referrer: referrerId,
    invitee: inviteeId,
    inviteeEmail,
    rewardStars: SIGNUP_REWARD,
    rewardType: 'signup',
  });
  await recordReferralMission(referrerId);

  let inviteeLabel: string | null = null;
  if (inviteeId) {
    const invitee = await User.findById(inviteeId).select('displayName username').lean();
    inviteeLabel = invitee?.displayName ?? invitee?.username ?? null;
  } else if (inviteeEmail) {
    inviteeLabel = inviteeEmail;
  }

  await createNotification({
    userId: referrerId,
    type: 'referral-signup',
    title: 'Your invite joined Ripple',
    body: inviteeLabel
      ? `${inviteeLabel} just signed up with your link. Earned ${SIGNUP_REWARD} Stars!`
      : `A new member joined Ripple with your link. Earned ${SIGNUP_REWARD} Stars!`,
    metadata: {
      ledgerId: ledgerEntry._id,
      inviteeId,
      inviteeEmail,
    },
  });
};
