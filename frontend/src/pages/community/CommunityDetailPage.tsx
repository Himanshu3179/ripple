import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CommunityHero from '../../components/community/CommunityHero';
import PostCard from '../../components/post/PostCard';
import { useCommunity, useCommunityActions, useCommunityMembers, useCommunityPosts } from '../../hooks/useCommunities';
import MissionCard from '../../components/missions/MissionCard';
import { useMissions } from '../../pages/missions/hooks';
import useAuth from '../../hooks/useAuth';
import TipsPanel from '../../components/economy/TipsPanel';
import { claimMission } from '../../lib/missions';
import TipButton from '../../components/economy/TipButton';

const CommunityDetailPage = () => {
  const params = useParams<{ identifier: string }>();
  const identifier = params.identifier || '';
  const queryClient = useQueryClient();
  const { data: community, isLoading, error } = useCommunity(identifier);
  const { data: posts } = useCommunityPosts(identifier, { sort: 'new' });
  const { data: members } = useCommunityMembers(identifier);
  const { createInvite, join, leave } = useCommunityActions();
  const { user, isAuthenticated } = useAuth();
  const { missions, claim } = useMissions();

  const inviteMutation = useMutation({
    mutationFn: (payload: { maxUses?: number; expiresAt?: string }) =>
      createInvite.mutateAsync({ identifier, ...payload }),
    onSuccess: (invite) => {
      toast.success(`Invite created: ${invite.code}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Unable to create invite');
    },
  });

  const modMissions = useMemo(() => missions.filter((mission) => mission.template.type === 'invite'), [missions]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-slate-900">Community</h2>
        <p className="mt-2 text-sm text-slate-500">Unable to load community.</p>
      </div>
    );
  }

  if (isLoading || !community) {
    return <p className="px-4 py-8 text-center text-sm text-slate-500">Loading community...</p>;
  }

  const membership = community.membership;
  const isMember = membership?.status === 'active';
  const isMod = membership && ['owner', 'moderator'].includes(membership.role);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <CommunityHero
        community={community}
        onJoin={() => join.mutate({ identifier })}
        onLeave={() => leave.mutate(identifier)}
        isJoining={join.isPending}
        isLeaving={leave.isPending}
      />

      {isMod && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Invite new members</h3>
            <p className="text-sm text-slate-500">Generate a shareable code for private members.</p>
            <button
              type="button"
              onClick={() => inviteMutation.mutate({})}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Create invite
            </button>
            {inviteMutation.data && (
              <div className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                Code: {inviteMutation.data.code}
              </div>
            )}
          </section>
          {modMissions.length > 0 && (
            <MissionCard
              mission={modMissions[0]}
              claiming={claim.isPending}
              onClaim={(missionId) => claim.mutate(missionId)}
            />
          )}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Latest posts</h2>
            {isMember && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-post-composer'))}
                className="rounded-xl bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
              >
                New post
              </button>
            )}
          </div>
          {posts?.length === 0 && <p className="text-sm text-slate-500">No posts yet.</p>}
          <div className="space-y-4">
            {posts?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Members</h3>
            <p className="text-sm text-slate-500">{community.memberCount.toLocaleString()} members</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {members?.slice(0, 6).map((member) => (
                <div key={member._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>{member.user.displayName}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-400">{member.role}</span>
                </div>
              ))}
              {members && members.length > 6 && (
                <p className="text-xs text-slate-400">+ {members.length - 6} more</p>
              )}
            </div>
          </section>

          {isAuthenticated && isMember && user && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
              <h3 className="text-lg font-semibold text-slate-900">Support creators</h3>
              <p className="text-sm text-slate-500">Send Stars to keep the community engaged.</p>
              <TipsPanel />
            </section>
          )}
        </aside>
      </section>
    </div>
  );
};

export default CommunityDetailPage;
