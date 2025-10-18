export interface MembershipFeature {
  key: string;
  label: string;
  limit?: number | null;
}

export interface MembershipPlan {
  tier: 'free' | 'star-pass' | 'star-unlimited';
  name: string;
  monthlyStars: number;
  priceMonthlyINR: number;
  priceYearlyINR: number;
  aiPostsPerMonth: number;
  features: MembershipFeature[];
}

export interface StarPack {
  id: string;
  name: string;
  stars: number;
  priceINR: number;
  bonusPercentage?: number;
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    tier: 'free',
    name: 'Explorer',
    monthlyStars: 20,
    priceMonthlyINR: 0,
    priceYearlyINR: 0,
    aiPostsPerMonth: 5,
    features: [
      { key: 'ai-posts', label: '5 Starforge AI posts / month', limit: 5 },
      { key: 'ad-supported', label: 'Ad-supported experience' },
      { key: 'community-access', label: 'Join public communities' },
    ],
  },
  {
    tier: 'star-pass',
    name: 'Star Pass',
    monthlyStars: 300,
    priceMonthlyINR: 499,
    priceYearlyINR: 4999,
    aiPostsPerMonth: 60,
    features: [
      { key: 'ai-posts', label: '60 Starforge AI posts / month', limit: 60 },
      { key: 'ad-free', label: 'Ad-free browsing' },
      { key: 'advanced-analytics', label: 'Advanced profile & post analytics' },
      { key: 'creator-tools', label: 'Schedule posts & unlock creator hub' },
      { key: 'themes', label: 'Premium themes & profile frames' },
    ],
  },
  {
    tier: 'star-unlimited',
    name: 'Star Federation',
    monthlyStars: 1200,
    priceMonthlyINR: 1499,
    priceYearlyINR: 14999,
    aiPostsPerMonth: -1,
    features: [
      { key: 'ai-unlimited', label: 'Unlimited Starforge AI posts', limit: null },
      { key: 'mod-suite', label: 'Pro moderation suite with AI triage' },
      { key: 'priority-support', label: 'Priority support & roadmap voting' },
      { key: 'invite-only', label: 'Access to invite-only lounges' },
      { key: 'revenue-share', label: 'Enhanced revenue share on Stars tips' },
    ],
  },
];

export const STAR_PACKS: StarPack[] = [
  {
    id: 'starter',
    name: 'Starter Orbit',
    stars: 150,
    priceINR: 199,
  },
  {
    id: 'booster',
    name: 'Cosmic Booster',
    stars: 400,
    priceINR: 449,
    bonusPercentage: 5,
  },
  {
    id: 'nebula',
    name: 'Nebula Vault',
    stars: 1200,
    priceINR: 1299,
    bonusPercentage: 12,
  },
  {
    id: 'supernova',
    name: 'Supernova Hoard',
    stars: 2800,
    priceINR: 2499,
    bonusPercentage: 18,
  },
];
