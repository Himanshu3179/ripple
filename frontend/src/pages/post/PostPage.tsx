import { useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import Avatar from '../../components/common/Avatar';
import TopicBadge from '../../components/common/TopicBadge';
import VoteControls from '../../components/post/VoteControls';
import CommentComposer from '../../components/comments/CommentComposer';
import CommentThread from '../../components/comments/CommentThread';
import dayjs from '../../utils/date';
import api from '../../lib/api';
import type { CommentResource, PostResource } from '../../types';

const PostPage = () => {
  const params = useParams<{ postId?: string }>();
  const postId = params.postId ?? '';
  const hasPostId = postId.length > 0;
  const navigate = useNavigate();

  const {
    data: postData,
    isLoading: postLoading,
    isError: postError,
  } = useQuery<PostResource>({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data } = await api.get<{ post: PostResource }>(`/posts/${postId}`);
      return data.post;
    },
    enabled: hasPostId,
  });

  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = useQuery<CommentResource[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await api.get<{ comments: CommentResource[] }>(
        `/posts/${postId}/comments`,
      );
      return data.comments;
    },
    enabled: hasPostId,
  });

  const post = postData;
  const comments = commentsData || [];
  const shouldShowSkeleton = postLoading && !post;

  const readingTime = useMemo(() => {
    if (!post?.body) {
      return 1;
    }
    const words = post.body.split(/\s+/).length || 0;
    return Math.max(1, Math.round(words / 200));
  }, [post?.body]);

  if (!hasPostId) {
    return <Navigate to="/" replace />;
  }

  if (postError) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Post not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          This post might have been removed or is no longer available.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Go back
        </button>
      </div>
    );
  }

  if (shouldShowSkeleton) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-72 rounded-3xl bg-white" />
        <div className="h-48 rounded-3xl bg-white" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
      >
        <HiOutlineArrowLeft />
        Back to feed
      </Link>

      <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={post.author?.displayName} color={post.author?.avatarColor} />
            <div>
              <p className="text-sm font-semibold text-slate-700">{post.author?.displayName}</p>
              <p className="text-xs text-slate-400">
                @{post.author?.username} · {dayjs(post.createdAt).format('MMM D, YYYY • h:mm A')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <TopicBadge topic={post.topic} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500">
              {readingTime} min read
            </span>
          </div>

          <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{post.title}</h1>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="max-h-96 w-full rounded-3xl object-cover"
            />
          )}

          {post.body && (
            <div className="prose prose-slate max-w-none text-lg leading-relaxed">
              {post.body.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <VoteControls postId={post.id} score={post.score} viewerVote={post.viewerVote} />
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
              {post.commentCount} comments
            </div>
          </div>
        </div>
      </article>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Discussion</h2>
        <CommentComposer postId={post.id} />
        {commentsLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        )}
        {!commentsLoading && <CommentThread comments={comments} postId={post.id} />}
      </section>
    </div>
  );
};

export default PostPage;
