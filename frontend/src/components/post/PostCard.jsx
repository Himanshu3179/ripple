import { Link } from 'react-router-dom';
import { HiOutlineChatBubbleBottomCenterText } from 'react-icons/hi2';
import TopicBadge from '../common/TopicBadge.jsx';
import Avatar from '../common/Avatar.jsx';
import VoteControls from './VoteControls.jsx';
import dayjs from '../../utils/date.js';

const truncate = (value, length) => {
  if (!value) return '';
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}…`;
};

const PostCard = ({ post }) => {
  const { author, id, title, body, topic, score, commentCount, createdAt, viewerVote, imageUrl } = post;

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="order-2 flex-1 space-y-4 md:order-1">
          <div className="flex items-center gap-3">
            <Avatar name={author?.displayName} color={author?.avatarColor} size="sm" />
            <div>
              <p className="text-sm font-semibold text-slate-700">{author?.displayName}</p>
              <p className="text-xs text-slate-400">
                @{author?.username} · {dayjs(createdAt).fromNow()}
              </p>
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
