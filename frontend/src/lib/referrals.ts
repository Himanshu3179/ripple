import api from './api';

export type ReferralRewardType = 'signup' | 'subscription';

export interface ReferralLedgerEntry {
  _id: string;
  invitee?: string;
  inviteeEmail?: string;
  rewardStars: number;
  rewardType: ReferralRewardType;
  claimed: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReferralDashboard {
  code: string;
  invitedCount: number;
  rewardsClaimed: number;
  ledger: ReferralLedgerEntry[];
}

export const fetchReferralDashboard = async () => {
  const { data } = await api.get<ReferralDashboard>('/referrals/dashboard');
  return data;
};

export const claimReferralRewards = async () => {
  const { data } = await api.post<{ message: string; starsBalance: number; claimedRewards: number }>(
    '/referrals/claim',
  );
  return data;
};
