import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { claimMission, fetchLeaderboard, fetchMissions } from '../../lib/missions';
import useAuth from '../../hooks/useAuth';

export const useMissions = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: fetchMissions,
    enabled: isAuthenticated,
  });

  const claim = useMutation({
    mutationFn: claimMission,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-meta'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Unable to claim mission reward');
    },
  });

  return { missions, isLoading, claim };
};

export const useLeaderboard = (type: 'missions' | 'referrals' | 'stars-earned') =>
  useQuery({
    queryKey: ['leaderboard', type],
    queryFn: () => fetchLeaderboard(type),
  });
