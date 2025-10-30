import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createCommunity,
  fetchCommunity,
  fetchCommunityPosts,
  fetchMembers,
  fetchMyCommunities,
  joinCommunity,
  leaveCommunity,
  modBanMember,
  modRemoveComment,
  modRemovePost,
  modUnbanMember,
  updateCommunitySettings,
  createInvite,
  CommunitySummary,
  CommunityMember,
} from '../lib/communities';

export const useMyCommunities = (enabled = true) =>
  useQuery({
    queryKey: ['communities', 'mine'],
    queryFn: fetchMyCommunities,
    enabled,
  });

export const useCommunity = (identifier: string) =>
  useQuery({
    queryKey: ['communities', identifier],
    queryFn: () => fetchCommunity(identifier),
    enabled: Boolean(identifier),
  });

export const useCommunityPosts = (identifier: string, params: { sort?: string; q?: string }) =>
  useQuery({
    queryKey: ['community-posts', identifier, params],
    queryFn: () => fetchCommunityPosts(identifier, params),
    enabled: Boolean(identifier),
  });

export const useCommunityMembers = (identifier: string) =>
  useQuery({
    queryKey: ['community-members', identifier],
    queryFn: () => fetchMembers(identifier),
    enabled: Boolean(identifier),
  });

export const useCommunityActions = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createCommunity,
    onSuccess: (community: CommunitySummary) => {
      toast.success(`Created ${community.name}`);
      queryClient.invalidateQueries({ queryKey: ['communities', 'mine'] });
    },
  });

  const join = useMutation({
    mutationFn: ({ identifier, inviteCode }: { identifier: string; inviteCode?: string }) =>
      joinCommunity(identifier, inviteCode),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['communities', variables.identifier] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'mine'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Unable to join community');
    },
  });

  const leave = useMutation({
    mutationFn: (identifier: string) => leaveCommunity(identifier),
    onSuccess: (_data, identifier) => {
      toast.success('Left community');
      queryClient.invalidateQueries({ queryKey: ['communities', identifier] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'mine'] });
    },
  });

  const updateSettings = useMutation({
    mutationFn: (
      payload: {
        identifier: string;
        settings: { bannedKeywords?: string[]; allowExternalLinks?: boolean; slowModeSeconds?: number };
      },
    ) => updateCommunitySettings(payload.identifier, payload.settings),
    onSuccess: (_data, payload) => {
      toast.success('Community settings updated');
      queryClient.invalidateQueries({ queryKey: ['communities', payload.identifier] });
    },
  });

  const removePost = useMutation({
    mutationFn: ({ identifier, postId }: { identifier: string; postId: string }) =>
      modRemovePost(identifier, postId),
    onSuccess: (_data, { identifier }) => {
      toast.success('Post removed');
      queryClient.invalidateQueries({ queryKey: ['community-posts', identifier] });
    },
  });

  const removeComment = useMutation({
    mutationFn: ({ identifier, commentId }: { identifier: string; commentId: string }) =>
      modRemoveComment(identifier, commentId),
    onSuccess: () => {
      toast.success('Comment removed');
    },
  });

  const ban = useMutation({
    mutationFn: ({ identifier, memberId }: { identifier: string; memberId: string }) =>
      modBanMember(identifier, memberId),
    onSuccess: (_data, { identifier }) => {
      toast.success('Member banned');
      queryClient.invalidateQueries({ queryKey: ['community-members', identifier] });
    },
  });

  const unban = useMutation({
    mutationFn: ({ identifier, memberId }: { identifier: string; memberId: string }) =>
      modUnbanMember(identifier, memberId),
    onSuccess: (_data, { identifier }) => {
      toast.success('Member unbanned');
      queryClient.invalidateQueries({ queryKey: ['community-members', identifier] });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: ({ identifier, maxUses, expiresAt }: { identifier: string; maxUses?: number; expiresAt?: string }) =>
      createInvite(identifier, { maxUses, expiresAt }),
  });

  return {
    create,
    join,
    leave,
    updateSettings,
    removePost,
    removeComment,
    ban,
    unban,
    createInvite: createInviteMutation,
  };
};

export type { CommunitySummary, CommunityMember };
