import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createScheduledPost, fetchScheduledPosts, cancelScheduledPost } from '../../lib/schedule';
import { useMyCommunities } from '../../hooks/useCommunities';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const SchedulePage = () => {
  const { isAuthenticated, isPremium } = useAuth();
  const queryClient = useQueryClient();
  const { data: scheduledPosts } = useQuery({ queryKey: ['schedule'], queryFn: fetchScheduledPosts, enabled: isAuthenticated });
  const { data: communities } = useMyCommunities(isAuthenticated);
  const [formState, setFormState] = useState({
    title: '',
    body: '',
    topic: '',
    scheduledFor: '',
    communityId: '',
  });

  const createMutation = useMutation({
    mutationFn: () => createScheduledPost({
      title: formState.title,
      body: formState.body,
      topic: formState.topic,
      scheduledFor: formState.scheduledFor,
      communityId: formState.communityId || undefined,
    }),
    onSuccess: () => {
      toast.success('Post scheduled');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      setFormState({ title: '', body: '', topic: '', scheduledFor: '', communityId: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Unable to schedule post');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (scheduledId: string) => cancelScheduledPost(scheduledId),
    onSuccess: () => {
      toast.success('Scheduled post cancelled');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-slate-900">Scheduled posts</h2>
        <p className="mt-2 text-sm text-slate-500">Sign in to plan posts ahead of time.</p>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-slate-900">Scheduled posts</h2>
        <p className="mt-2 text-sm text-slate-500">Upgrade to Star Pass to unlock scheduled publishing.</p>
      </div>
    );
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formState.title || !formState.topic || !formState.scheduledFor) {
      toast.error('Please fill all required fields');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-slate-900">Schedule posts</h1>
        <p className="text-sm text-slate-500">Plan content drops and keep your community active while you sleep.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold text-slate-900">New scheduled post</h3>
          <div>
            <label className="text-sm font-semibold text-slate-600">Title</label>
            <input
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Topic</label>
            <input
              value={formState.topic}
              onChange={(event) => setFormState((prev) => ({ ...prev, topic: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Body</label>
            <textarea
              value={formState.body}
              onChange={(event) => setFormState((prev) => ({ ...prev, body: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Scheduled time</label>
            <input
              type="datetime-local"
              value={formState.scheduledFor}
              onChange={(event) => setFormState((prev) => ({ ...prev, scheduledFor: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Community (optional)</label>
            <select
              value={formState.communityId}
              onChange={(event) => setFormState((prev) => ({ ...prev, communityId: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Personal feed</option>
              {communities?.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Schedule
          </button>
        </form>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Queued posts</h3>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              {scheduledPosts?.length === 0 && <p className="text-sm text-slate-500">No scheduled posts yet.</p>}
              {scheduledPosts?.map((post) => (
                <div key={post._id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">{post.title}</p>
                  <p className="text-xs text-slate-400">Scheduled for {new Date(post.scheduledFor).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Status: {post.status}</p>
                  {post.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => cancelMutation.mutate(post._id)}
                      className="mt-2 text-xs font-semibold text-brand-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default SchedulePage;
