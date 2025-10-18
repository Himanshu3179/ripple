import User from '../models/User';
import StarLedger from '../models/StarLedger';
import { StarLedgerEntryType } from '../config/economy';

export const adjustStars = async (
  userId: string,
  delta: number,
  type: StarLedgerEntryType,
  reference?: string,
  metadata?: Record<string, unknown>,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.starsBalance = Math.max(0, (user.starsBalance ?? 0) + delta);
  await user.save();

  await StarLedger.create({
    user: user._id,
    stars: delta,
    balanceAfter: user.starsBalance,
    type,
    reference,
    metadata,
  });

  return user;
};
