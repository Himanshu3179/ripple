import api from './api';

export interface Mission {
  _id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  status: 'active' | 'completed' | 'claimed' | 'expired';
  rewardStars: number;
  template: {
    type: 'post' | 'comment' | 'starforge' | 'invite';
    streakType?: string;
  };
}

export const fetchMissions = async () => {
  const { data } = await api.get<{ missions: Mission[] }>('/missions');
  return data.missions;
};

export const claimMission = async (missionId: string) => {
  const { data } = await api.post<{ message: string; starsBalance: number; mission: Mission }>(
    `/missions/${missionId}/claim`,
  );
  return data;
};

export const fetchLeaderboard = async (type: 'missions' | 'referrals' | 'stars-earned' = 'missions') => {
  const { data } = await api.get<{ type: string; entries: Array<{ _id: string; value: number; user: { _id: string; username: string; displayName: string; avatarColor?: string } }> }>(
    `/missions/leaderboard/global?type=${type}`,
  );
  return data.entries;
};
