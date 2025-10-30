import api from './api';
import type { NotificationResource } from '../types';

interface RawNotification extends Omit<NotificationResource, 'id'> {
  _id: string;
}

export interface NotificationPage {
  notifications: NotificationResource[];
  unreadCount: number;
  nextCursor: string | null;
}

const toNotification = (raw: RawNotification): NotificationResource => ({
  id: raw._id,
  type: raw.type,
  title: raw.title,
  body: raw.body,
  read: raw.read,
  readAt: raw.readAt,
  metadata: raw.metadata,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const fetchNotifications = async (cursor?: string | null, limit = 20): Promise<NotificationPage> => {
  const params = new URLSearchParams();
  params.set('limit', limit.toString());
  if (cursor) {
    params.set('cursor', cursor);
  }

  const { data } = await api.get<{
    notifications: RawNotification[];
    unreadCount: number;
    nextCursor: string | null;
  }>(`/notifications?${params.toString()}`);

  return {
    notifications: data.notifications.map(toNotification),
    unreadCount: data.unreadCount,
    nextCursor: data.nextCursor,
  };
};

export const markNotificationRead = async (notificationId: string) => {
  const { data } = await api.post<{ notification: RawNotification }>(`/notifications/${notificationId}/read`);
  return toNotification(data.notification);
};

export const markAllNotificationsRead = async () => {
  await api.post('/notifications/read-all');
};
