import { NextFunction, Request, Response } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';
import PaymentTransaction from '../models/PaymentTransaction';
import { adjustStars } from '../services/starService';

const isPremium = (tier: string | undefined) => tier === 'star-pass' || tier === 'star-unlimited';

export const getMyAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!isPremium(req.user.membershipTier)) {
      res.status(403).json({ message: 'Upgrade to Star Pass to access analytics' });
      return;
    }

    const [postStats, commentStats, recentTransactions] = await Promise.all([
      Post.aggregate([
        { $match: { author: req.user._id } },
        {
          $group: {
            _id: null,
            posts: { $sum: 1 },
            totalScore: { $sum: { $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] } },
            totalComments: { $sum: '$commentCount' },
          },
        },
      ]),
      Comment.aggregate([
        { $match: { author: req.user._id } },
        {
          $group: {
            _id: null,
            comments: { $sum: 1 },
            totalScore: { $sum: { $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] } },
          },
        },
      ]),
      PaymentTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const postSummary = postStats[0] || { posts: 0, totalScore: 0, totalComments: 0 };
    const commentSummary = commentStats[0] || { comments: 0, totalScore: 0 };

    res.status(200).json({
      posts: postSummary.posts,
      postScore: postSummary.totalScore,
      postComments: postSummary.totalComments,
      comments: commentSummary.comments,
      commentScore: commentSummary.totalScore,
      recentTransactions,
    });
  } catch (error) {
    next(error as Error);
  }
};
