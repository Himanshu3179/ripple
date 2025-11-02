import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlinePlusCircle } from 'react-icons/hi2';
import useAuth from '../../hooks/useAuth';
import { useCommunityActions, useMyCommunities, CommunitySummary } from '../../hooks/useCommunities';

const CommunitiesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: communities, isLoading } = useMyCommunities();
  const { create, join } = useCommunityActions();
  const [formState, setFormState] = useState({ name: '', description: '', visibility: 'public' });
  const [joinState, setJoinState] = useState({ identifier: '', inviteCode: '' });
  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      toast.error('Community name required');
      return;
    }
    create.mutate(
      {
        name: formState.name.trim(),
        description: formState.description.trim(),
        visibility: formState.visibility as CommunitySummary['visibility'],
      },
      {
        onSuccess: (community) => {
          queryClient.invalidateQueries({ queryKey: ['community-posts', community.slug] });
          navigate(`/communities/${community.slug}`);
        },
      },
    );
  };

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    if (!joinState.identifier.trim()) {
      toast.error('Enter community slug or id');
      return;
    }
    join.mutate({ identifier: joinState.identifier.trim(), inviteCode: joinState.inviteCode.trim() });
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-slate-900">Communities</h2>
        <p className="mt-2 text-sm text-slate-500">Sign in to create or join interest-focused communities.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-slate-900">Your communities</h1>
        <p className="text-sm text-slate-500">Create new spaces or join existing ones to organise discussions by interests.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Communities you belong to</h2>
          {isLoading && <p className="text-sm text-slate-500">Loading communities...</p>}
          {!isLoading && communities && communities.length === 0 && (
            <p className="text-sm text-slate-500">You haven&apos;t joined any communities yet.</p>
          )}
          <div className="space-y-4">
            {communities?.map((community) => (
              <button
                key={community.id}
                onClick={() => navigate(`/communities/${community.slug}`)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{community.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{community.visibility}</p>
                    {community.description && (
                      <p className="mt-1 text-sm text-slate-500">{community.description}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>{community.memberCount.toLocaleString()} members</p>
                    {community.membership?.status === 'pending' && (
                      <p className="text-amber-500">Pending approval</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleCreate} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Create community</h3>
            <div>
              <label htmlFor="community-name" className="text-sm font-semibold text-slate-600">
                Name
              </label>
              <input
                id="community-name"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. ripple-builders"
              />
            </div>
            <div>
              <label htmlFor="community-description" className="text-sm font-semibold text-slate-600">
                Description
              </label>
              <textarea
                id="community-description"
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Visibility</label>
              <select
                value={formState.visibility}
                onChange={(event) => setFormState((prev) => ({ ...prev, visibility: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="public">Public</option>
                <option value="restricted">Restricted (approval required)</option>
                <option value="private">Private (invite only)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HiOutlinePlusCircle /> Create
            </button>
          </form>

          <form onSubmit={handleJoin} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Join by invite</h3>
            <div>
              <label className="text-sm font-semibold text-slate-600">Community slug or ID</label>
              <input
                value={joinState.identifier}
                onChange={(event) => setJoinState((prev) => ({ ...prev, identifier: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Invite code (optional)</label>
              <input
                value={joinState.inviteCode}
                onChange={(event) => setJoinState((prev) => ({ ...prev, inviteCode: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={join.isPending}
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Join community
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default CommunitiesPage;
