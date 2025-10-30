import { Types } from 'mongoose';
import Notification, { NotificationType } from '../models/Notification';

interface CreateNotificationInput {
  userId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export const createNotification = async ({
  userId,
  type,
  title,
  body,
  metadata,
}: CreateNotificationInput) => {
  const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  return Notification.create({
    user: userObjectId,
    type,
    title,
    body,
    metadata: metadata ?? {},
  });
};

export const markNotificationRead = async (notificationId: string, userId: Types.ObjectId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { read: true, readAt: new Date() } },
    { new: true },
  );
};

export const markAllNotificationsRead = async (userId: Types.ObjectId) => {
  return Notification.updateMany(
    { user: userId, read: false },
    { $set: { read: true, readAt: new Date() } },
  );
};
