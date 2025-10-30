import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import Notification from '../models/Notification';
import { markAllNotificationsRead, markNotificationRead } from '../services/notificationService';

export const listNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { limit = '20', cursor } = req.query as { limit?: string; cursor?: string };
    const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 50);

    const query: Record<string, unknown> = { user: req.user._id };
    if (cursor && Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const notifications = await Notification.find(query)
      .sort({ _id: -1 })
      .limit(pageSize + 1)
      .lean();

    const hasMore = notifications.length > pageSize;
    const items = hasMore ? notifications.slice(0, pageSize) : notifications;
    const nextCursor = hasMore ? items[items.length - 1]._id.toString() : null;

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.status(200).json({
      notifications: items,
      unreadCount,
      nextCursor,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const markNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { notificationId } = req.params as { notificationId: string };
    if (!Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({ message: 'Invalid notification id' });
      return;
    }

    const updated = await markNotificationRead(notificationId, req.user._id);
    if (!updated) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.status(200).json({ notification: updated });
  } catch (error) {
    next(error as Error);
  }
};

export const markAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await markAllNotificationsRead(req.user._id);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error as Error);
  }
};
