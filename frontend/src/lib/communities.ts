import api from './api';
import type { PostResource, AuthenticatedUser } from '../types';

enum Visibility {
  public = 'public',
  restricted = 'restricted',
  private = 'private',
}

export interface CommunitySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visibility: Visibility;
  avatarImage?: string;
  bannerImage?: string;
  memberCount: number;
  membership?: {
    role: 'owner' | 'moderator' | 'member';
    status: 'active' | 'pending' | 'banned';
  } | null;
}

export interface CommunityMember {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatarColor?: string;
  };
  role: 'owner' | 'moderator' | 'member';
  status: 'active' | 'pending' | 'banned';
  joinedAt: string;
}

export const fetchMyCommunities = async () => {
  const { data } = await api.get<{ communities: CommunitySummary[] }>('/communities');
  return data.communities;
};

export const fetchCommunity = async (identifier: string) => {
  const { data } = await api.get<{ community: CommunitySummary }>('/communities/' + identifier);
  return data.community;
};

export const createCommunity = async (payload: {
  name: string;
  description?: string;
  visibility?: Visibility;
}) => {
  const { data } = await api.post<{ community: CommunitySummary }>('/communities', payload);
  return data.community;
};

export const joinCommunity = async (identifier: string, inviteCode?: string) => {
  const { data } = await api.post<{ community: CommunitySummary; message: string }>(
    `/communities/${identifier}/join`,
    { inviteCode },
  );
  return data;
};

export const leaveCommunity = async (identifier: string) => {
  await api.post(`/communities/${identifier}/leave`);
};

export const fetchMembers = async (identifier: string) => {
  const { data } = await api.get<{ members: CommunityMember[] }>(`/communities/${identifier}/members`);
  return data.members;
};

export const createInvite = async (
  identifier: string,
  payload: { maxUses?: number; expiresAt?: string },
) => {
  const { data } = await api.post<{ invite: { code: string; maxUses?: number; expiresAt?: string } }>(
    `/communities/${identifier}/invites`,
    payload,
  );
  return data.invite;
};

export const fetchCommunityPosts = async (
  identifier: string,
  params: { sort?: string; q?: string } = {},
) => {
  const query = new URLSearchParams({ community: identifier, ...params }).toString();
  const { data } = await api.get<{ posts: PostResource[] }>(`/posts?${query}`);
  return data.posts;
};

export const updateCommunitySettings = async (
  identifier: string,
  payload: { bannedKeywords?: string[]; allowExternalLinks?: boolean; slowModeSeconds?: number },
) => {
  const { data } = await api.put<{ settings: any }>(
    `/communities/${identifier}/mod/settings`,
    payload,
  );
  return data.settings;
};

export const modRemovePost = async (identifier: string, postId: string) => {
  await api.post(`/communities/${identifier}/mod/posts/${postId}/remove`);
};

export const modRemoveComment = async (identifier: string, commentId: string) => {
  await api.post(`/communities/${identifier}/mod/comments/${commentId}/remove`);
};

export const modBanMember = async (identifier: string, memberId: string) => {
  await api.post(`/communities/${identifier}/mod/members/${memberId}/ban`);
};

export const modUnbanMember = async (identifier: string, memberId: string) => {
  await api.post(`/communities/${identifier}/mod/members/${memberId}/unban`);
};

export type { Visibility as CommunityVisibility };
