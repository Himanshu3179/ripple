import api from './api';

export const tipUser = async (payload: { recipientId: string; stars: number; message?: string; postId?: string }) => {
  const { data } = await api.post('/economy/tip', payload);
  return data;
};

export const boostPost = async (postId: string) => {
  const { data } = await api.post(`/economy/posts/${postId}/boost`);
  return data;
};

export const fetchLedger = async () => {
  const { data } = await api.get<{ entries: Array<{ _id: string; type: string; stars: number; balanceAfter: number; createdAt: string; metadata?: Record<string, unknown> }> }>('/economy/ledger');
  return data.entries;
};
