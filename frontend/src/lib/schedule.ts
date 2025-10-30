import api from './api';

export interface ScheduledPost {
  _id: string;
  title: string;
  topic: string;
  scheduledFor: string;
  status: 'scheduled' | 'published' | 'cancelled' | 'failed';
  community?: string | null;
  createdAt: string;
}

export const fetchScheduledPosts = async () => {
  const { data } = await api.get<{ posts: ScheduledPost[] }>('/schedule');
  return data.posts;
};

export const createScheduledPost = async (payload: {
  title: string;
  body?: string;
  topic: string;
  imageUrl?: string;
  scheduledFor: string;
  communityId?: string;
}) => {
  const { data } = await api.post<{ scheduled: ScheduledPost }>('/schedule', payload);
  return data.scheduled;
};

export const cancelScheduledPost = async (scheduledId: string) => {
  await api.post(`/schedule/${scheduledId}/cancel`);
};
