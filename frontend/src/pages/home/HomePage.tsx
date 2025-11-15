import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineSparkles } from 'react-icons/hi2';
import clsx from 'clsx';
import PostCard from '../../components/post/PostCard';
import api from '../../lib/api';
import useAuth from '../../hooks/useAuth';
import type { PostResource } from '../../types';
import { useMyCommunities } from '../../hooks/useCommunities';

const LoadingPlaceholder = () => (
  <div className="animate-pulse space-y-6">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
          <div className="h-3 w-24 rounded-full bg-slate-200" />
        </div>
        <div className="mt-4 h-6 w-3/4 rounded-full bg-slate-200" />
        <div className="mt-3 h-3 w-full rounded-full bg-slate-200" />
        <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-200" />
        <div className="mt-6 h-10 w-32 rounded-full bg-slate-200" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ query }: { query?: string }) => (
  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
    <HiOutlineSparkles className="mx-auto text-4xl text-brand-400" />
    <h3 className="mt-4 text-lg font-semibold text-slate-800">No posts found</h3>
    <p className="mt-2 text-sm text-slate-500">
      {query ? (
        <>
          We couldn&apos;t find anything for <span className="font-semibold text-slate-700">“{query}”</span>.
        </>
      ) : (
        'Be the first to share something with the community.'
      )}
    </p>
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sort = searchParams.get('sort') || 'hot';
  const topic = searchParams.get('topic') || '';
  const query = searchParams.get('q') || '';
  const community = searchParams.get('community') || '';
  const { isAuthenticated } = useAuth();


  const { data, isLoading } = useQuery<PostResource[]>({
    queryKey: ['posts', { sort, topic, query, community }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('sort', sort);
      if (topic) params.set('topic', topic);
      if (query) params.set('q', query);
      if (community) params.set('community', community);
      const search = params.toString();
      const endpoint = search ? `/posts?${search}` : '/posts';
      const { data: response } = await api.get<{ posts: PostResource[] }>(endpoint);
      return response.posts;
    },
  });

  const posts = data || [];
  const { data: communities } = useMyCommunities(isAuthenticated);

  const trendingTopics = useMemo(() => {
    const topicMap = new Map<string, number>();
    posts.forEach((post) => {
      const key = post.topic;
      const weight = Math.max(1, post.score + 1);
      topicMap.set(key, (topicMap.get(key) || 0) + weight);
    });

    return Array.from(topicMap.entries())
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6);
  }, [posts]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Share something new</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ask questions, start discussions, or showcase what you&apos;re building.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                window.dispatchEvent(new CustomEvent('open-post-composer'));
              }}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Create post
            </button>
          </div>
          {!isAuthenticated && (
            <p className="mt-3 text-xs text-slate-400">
              You need an account to publish posts. Sign in to get started.
            </p>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Community</label>
              <select
                value={community}
                onChange={(event) => {
                  const params = new URLSearchParams(window.location.search);
                  if (event.target.value) {
                    params.set('community', event.target.value);
                  } else {
                    params.delete('community');
                  }
                  navigate({ pathname: '/', search: params.toString() });
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Global feed</option>
                {communities?.map((communityOption) => (
                  <option key={communityOption.id} value={communityOption.slug}>
                    {communityOption.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Topic</label>
              <input
                value={topic}
                onChange={(event) => {
                  const params = new URLSearchParams(window.location.search);
                  if (event.target.value) {
                    params.set('topic', event.target.value);
                  } else {
                    params.delete('topic');
                  }
                  navigate({ pathname: '/', search: params.toString() });
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Filter by topic"
              />
            </div>
          </div>
        </div>
        {isLoading && <LoadingPlaceholder />}
        {!isLoading && posts.length === 0 && <EmptyState query={query} />}
        {!isLoading &&
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
      </div>

      <aside className="sticky top-24 hidden h-fit flex-col gap-6 lg:flex">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold text-slate-900">Trending topics</h3>
          <p className="mt-1 text-sm text-slate-500">Fresh conversations the community is loving.</p>

          <div className="mt-4 space-y-3">
            {trendingTopics.length === 0 && (
              <p className="text-sm text-slate-400">Post something to kickstart the discussion.</p>
            )}
            {trendingTopics.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  window.dispatchEvent(new CustomEvent('open-post-composer'));
                }}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white',
                      index === 0 && 'bg-brand-500',
                      index === 1 && 'bg-brand-400',
                      index === 2 && 'bg-brand-300',
                      index > 2 && 'bg-slate-300 text-slate-700',
                    )}
                  >
                    #{index + 1}
                  </span>
                  {item.name}
                </span>
                <span className="text-xs uppercase tracking-wide text-slate-400 ml-3">
                  {item.weight} pts
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-500/90 to-slate-900 p-6 shadow-card text-white">
          <h3 className="text-lg font-semibold">Create your community</h3>
          <p className="mt-2 text-sm text-white/80">
            Gather people around new interests with a space that feels curated and welcoming.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              window.dispatchEvent(new CustomEvent('open-post-composer'));
            }}
            className="mt-5 inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            Start a post
          </button>
        </section>
      </aside>
    </div>
  );
};

export default HomePage;
