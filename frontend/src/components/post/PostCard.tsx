import { Link } from 'react-router-dom';
import { HiOutlineChatBubbleBottomCenterText, HiMiniBolt } from 'react-icons/hi2';
import clsx from 'clsx';
import TopicBadge from '../common/TopicBadge';
import Avatar from '../common/Avatar';
import VoteControls from './VoteControls';
import dayjs from '../../utils/date';
import type { PostResource } from '../../types';
import BoostButton from '../economy/BoostButton';

const truncate = (value: string, length: number) => {
  if (!value) return '';
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}…`;
};

interface PostCardProps {
  post: PostResource;
}

const PostCard = ({ post }: PostCardProps) => {
  const { author, id, title, body, topic, score, commentCount, createdAt, viewerVote, imageUrl, community, boostedUntil } =
    post;
  const isBoosted = Boolean(boostedUntil && dayjs(boostedUntil).isAfter(dayjs()));

  return (
    <article
      className={clsx(
        'group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lg',
        isBoosted
          ? 'border-amber-300 shadow-[0_18px_45px_-18px_rgba(251,191,36,0.8)] ring-4 ring-amber-200/40'
          : 'border-slate-200',
      )}
    >
      {isBoosted && (
        <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
          <HiMiniBolt className="text-base" />
          Boosted
        </div>
      )}
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="order-2 flex-1 space-y-4 md:order-1">
          <div className="flex items-center gap-3">
            <Avatar name={author?.displayName} color={author?.avatarColor} size="sm" />
            <div>
              <p className="text-sm font-semibold text-slate-700">{author?.displayName}</p>
              <p className="text-xs text-slate-400">
                @{author?.username} · {dayjs(createdAt ?? undefined).fromNow()}
              </p>
              {community && (
                <Link
                  to={`/communities/${community.slug}`}
                  className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-brand-600"
                >
                  #{community.slug}
                </Link>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <TopicBadge topic={topic} />
            <Link
              to={`/posts/${id}`}
              className="block text-xl font-semibold leading-tight text-slate-900 transition group-hover:text-brand-600"
            >
              {title}
            </Link>
            {body && <p className="text-sm text-slate-600">{truncate(body, 240)}</p>}
            {community && (
              <Link
                to={`/communities/${community.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-brand-50 hover:text-brand-600"
              >
                #{community.slug}
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between">
            <VoteControls postId={id} score={score} viewerVote={viewerVote} />
            <Link
              to={`/posts/${id}`}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-brand-50 hover:text-brand-600"
            >
              <HiOutlineChatBubbleBottomCenterText className="text-lg" />
              {commentCount} comments
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {isBoosted && boostedUntil && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                <HiMiniBolt className="text-base" />
                Boosted until {dayjs(boostedUntil).format('MMM D, YYYY h:mm A')}
              </div>
            )}
            <BoostButton postId={id} />
          </div>
        </div>

        {imageUrl && (
          <Link
            to={`/posts/${id}`}
            className="order-1 block overflow-hidden rounded-2xl md:order-2 md:w-56"
          >
            <img
              src={imageUrl}
              alt={title}
              className="h-40 w-full object-cover transition group-hover:scale-105"
            />
          </Link>
        )}
      </div>
    </article>
  );
};

export default PostCard;
