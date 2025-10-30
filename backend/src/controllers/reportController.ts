import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import Report from '../models/Report';
import Post from '../models/Post';
import Comment from '../models/Comment';
import AuditLog from '../models/AuditLog';

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { targetType, targetId, reason } = req.body as {
      targetType: 'post' | 'comment' | 'user';
      targetId: string;
      reason: string;
    };

    if (!['post', 'comment', 'user'].includes(targetType) || !Types.ObjectId.isValid(targetId)) {
      res.status(400).json({ message: 'Invalid report payload' });
      return;
    }

    if (!reason || reason.trim().length < 10) {
      res.status(400).json({ message: 'Reason must be at least 10 characters' });
      return;
    }

    let community: Types.ObjectId | undefined;
    if (targetType === 'post') {
      const post = await Post.findById(targetId);
      if (!post) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }
      community = (post.community as Types.ObjectId | undefined) ?? undefined;
    } else if (targetType === 'comment') {
      const comment = await Comment.findById(targetId);
      if (!comment) {
        res.status(404).json({ message: 'Comment not found' });
        return;
      }
      const post = await Post.findById(comment.post);
      community = post?.community as Types.ObjectId | undefined;
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason: reason.trim(),
      community: community ?? null,
      status: 'open',
    });

    res.status(201).json({ report });
  } catch (error) {
    next(error as Error);
  }
};

export const listReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'open' } = req.query as { status?: string };
    const reports = await Report.find(status === 'all' ? {} : { status })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('reporter', 'username displayName')
      .lean();
    res.status(200).json({ reports });
  } catch (error) {
    next(error as Error);
  }
};

export const updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const { status, resolutionNote } = req.body as { status: 'reviewing' | 'resolved' | 'dismissed'; resolutionNote?: string };

    if (!Types.ObjectId.isValid(reportId)) {
      res.status(400).json({ message: 'Invalid report id' });
      return;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    report.status = status;
    report.moderator = req.user?._id ?? null;
    if (resolutionNote) report.resolutionNote = resolutionNote;
    await report.save();

    await AuditLog.create({
      actor: req.user?._id ?? report.reporter,
      action: `report_${status}`,
      targetType: report.targetType,
      targetId: report.targetId,
      metadata: { resolutionNote },
    });

    res.status(200).json({ report });
  } catch (error) {
    next(error as Error);
  }
};

export const listAuditLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200).populate('actor', 'username');
    res.status(200).json({ logs });
  } catch (error) {
    next(error as Error);
  }
};
