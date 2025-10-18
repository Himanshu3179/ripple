import api from './api';

export interface AiComposePayload {
  prompt: string;
  tone?: string;
  outline?: string[];
}

export const composePost = async (payload: AiComposePayload) => {
  const { data } = await api.post<{
    title: string;
    body: string;
    remainingQuota: number | null;
    renewsAt: string;
  }>('/ai/compose', payload);
  return data;
};
