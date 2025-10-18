import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import StarLedger from '../models/StarLedger';
import { adjustStars } from '../services/starService';
import { POST_BOOST_COST, POST_BOOST_DURATION_HOURS } from '../config/economy';

export const getLedger = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const entries = await StarLedger.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ entries });
  } catch (error) {
    next(error as Error);
  }
};

export const sendTip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { recipientId, stars, message, postId } = req.body as {
      recipientId: string;
      stars: number;
      message?: string;
      postId?: string;
    };

    if (!mongoose.Types.ObjectId.isValid(recipientId) || stars <= 0) {
      res.status(400).json({ message: 'Invalid tip request' });
      return;
    }

    if (recipientId === req.user._id.toString()) {
      res.status(400).json({ message: "You can't tip yourself" });
      return;
    }

    const senderBalance = req.user.starsBalance ?? 0;
    if (senderBalance < stars) {
      res.status(402).json({ message: 'Not enough Stars' });
      return;
    }

    const sender = await adjustStars(req.user._id.toString(), -stars, 'tip-sent', undefined, {
      recipientId,
      postId,
      message,
    });
    req.user.starsBalance = sender.starsBalance;
    await adjustStars(recipientId, stars, 'tip-received', undefined, {
      senderId: req.user._id,
      postId,
      message,
    });

    res.status(200).json({ message: 'Tip sent' });
  } catch (error) {
    next(error as Error);
  }
};

export const boostPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: 'Invalid post id' });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const balance = req.user.starsBalance ?? 0;
    if (balance < POST_BOOST_COST) {
      res.status(402).json({ message: 'Not enough Stars to boost' });
      return;
    }

    const sender = await adjustStars(
      req.user._id.toString(),
      -POST_BOOST_COST,
      'post-boost',
      `post:${postId}`,
    );
    req.user.starsBalance = sender.starsBalance;

    const boostUntil = post.boostedUntil && post.boostedUntil > new Date()
      ? new Date(post.boostedUntil)
      : new Date();
    boostUntil.setHours(boostUntil.getHours() + POST_BOOST_DURATION_HOURS);
    post.boostedUntil = boostUntil;
    post.boostScore = (post.boostScore ?? 0) + POST_BOOST_COST;
    await post.save();

    res.status(200).json({
      message: 'Post boosted',
      boostedUntil: post.boostedUntil,
      boostScore: post.boostScore,
    });
  } catch (error) {
    next(error as Error);
  }
};
