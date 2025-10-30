import { NextFunction, Request, Response } from 'express';
import User, { IUserDocument } from '../models/User';
import { generateReferralCode } from '../utils/referralCode';
import generateToken from '../utils/generateToken';
import { recordSignupReferral } from './referralController';

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarColor?: string;
  bio?: string;
  starsBalance: number;
  membershipTier: 'free' | 'star-pass' | 'star-unlimited';
  membershipExpiresAt?: Date | null;
  aiPostQuota?: {
    limit: number;
    used: number;
    renewsAt: Date;
  } | null;
  role: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  token: string;
  user: AuthenticatedUser;
}

const formatUser = (userDoc: IUserDocument): AuthenticatedUser => {
  const user = userDoc.toObject();

  return {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarColor: user.avatarColor,
    bio: user.bio || '',
    starsBalance: user.starsBalance ?? 0,
    membershipTier: (user.membershipTier as AuthenticatedUser['membershipTier']) || 'free',
    membershipExpiresAt: user.membershipExpiresAt ?? null,
    aiPostQuota: user.aiPostQuota
      ? {
          limit: user.aiPostQuota.limit,
          used: user.aiPostQuota.used,
          renewsAt: user.aiPostQuota.renewsAt,
        }
      : null,
    role: user.role || 'user',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, displayName, email, password, bio, referralCode } = req.body as Record<string, string>;

    if (!username || !displayName || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      res
        .status(409)
        .json({ message: 'User with the same email or username already exists' });
      return;
    }

    const referral = referralCode?.trim().toUpperCase();

    const user = await User.create({
      username: normalizedUsername,
      displayName: displayName.trim(),
      email: normalizedEmail,
      password,
      bio,
      referral: {
        code: generateReferralCode(),
      },
    });

    if (referral) {
      const referrer = await User.findOne({ 'referral.code': referral });
      if (referrer) {
        referrer.referral = referrer.referral || {
          code: generateReferralCode(),
          invitedCount: 0,
          rewardsClaimed: 0,
        };
        referrer.referral.invitedCount = (referrer.referral.invitedCount ?? 0) + 1;
        await referrer.save();
        await recordSignupReferral(referrer._id.toString(), user._id.toString());
      }
    }

    const token = generateToken(user._id.toString());

    const payload: AuthResponse = {
      token,
      user: formatUser(user),
    };

    res.status(201).json(payload);
  } catch (error) {
    next(error as Error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body as Record<string, string>;

    if (!identifier || !password) {
      res.status(400).json({ message: 'Missing credentials' });
      return;
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const query = normalizedIdentifier.includes('@')
      ? { email: normalizedIdentifier }
      : { username: normalizedIdentifier };

    const user = await User.findOne(query);

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString());

    const payload: AuthResponse = {
      token,
      user: formatUser(user),
    };

    res.status(200).json(payload);
  } catch (error) {
    next(error as Error);
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Logged out' });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.status(200).json({ user: formatUser(req.user) });
};
