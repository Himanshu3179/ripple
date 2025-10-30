import { AuthenticatedUser } from '../controllers/authController';

export const isPremiumTier = (tier: AuthenticatedUser['membershipTier']) =>
  tier === 'star-pass' || tier === 'star-unlimited';

export const isUnlimitedTier = (tier: AuthenticatedUser['membershipTier']) =>
  tier === 'star-unlimited';
