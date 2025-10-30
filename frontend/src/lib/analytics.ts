import api from './api';

export interface AnalyticsSummary {
  posts: number;
  postScore: number;
  postComments: number;
  comments: number;
  commentScore: number;
  recentTransactions: Array<{
    _id: string;
    kind: string;
    amountINR: number;
    starsAwarded?: number;
    status: string;
    createdAt: string;
  }>;
}

export const fetchAnalytics = async () => {
  const { data } = await api.get<AnalyticsSummary>('/analytics/me');
  return data;
};
