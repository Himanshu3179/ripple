import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineSparkles } from 'react-icons/hi2';
import clsx from 'clsx';
import PostComposer from '../../components/post/PostComposer.jsx';
import PostCard from '../../components/post/PostCard.jsx';
import api from '../../lib/api.js';

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

const EmptyState = ({ query }) => (
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
  const [searchParams] = useSearchParams();
  const sort = searchParams.get('sort') || 'hot';
  const topic = searchParams.get('topic') || '';
  const query = searchParams.get('q') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['posts', { sort, topic, query }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('sort', sort);
      if (topic) params.set('topic', topic);
      if (query) params.set('q', query);
      const search = params.toString();
      const endpoint = search ? `/posts?${search}` : '/posts';
      const { data: response } = await api.get(endpoint);
      return response.posts;
    },
  });

  const posts = data || [];

  const trendingTopics = useMemo(() => {
    const topicMap = new Map();
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
        <PostComposer />
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
              <div
                key={item.name}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600"
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
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {item.weight} pts
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-500/90 to-slate-900 p-6 shadow-card text-white">
          <h3 className="text-lg font-semibold">Create your community</h3>
          <p className="mt-2 text-sm text-white/80">
            Gather people around new interests with a space that feels curated and welcoming.
          </p>
          <a
            href="#post-composer"
            className="mt-5 inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            Start a post
          </a>
        </section>
      </aside>
    </div>
  );
};

export default HomePage;
