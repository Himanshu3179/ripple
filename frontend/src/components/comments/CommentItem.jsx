import { useState } from 'react';
import clsx from 'clsx';
import Avatar from '../common/Avatar.jsx';
import dayjs from '../../utils/date.js';
import CommentVoteControls from './CommentVoteControls.jsx';
import CommentComposer from './CommentComposer.jsx';

const CommentItem = ({ comment, postId, depth = 0 }) => {
  const [showReply, setShowReply] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="space-y-4">
      <div
        className={clsx(
          'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
          comment.isDeleted && 'border-dashed opacity-80',
        )}
      >
        <div className="flex gap-3">
          <Avatar
            name={comment.author?.displayName || 'Deleted'}
            color={comment.author?.avatarColor}
            size="sm"
          />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">
                {comment.author?.displayName || 'Deleted user'}
              </span>
              <span className="text-slate-400">@{comment.author?.username || 'removed'}</span>
              <span>·</span>
              <span>{dayjs(comment.createdAt).fromNow()}</span>
            </div>
            <p className={clsx('text-sm leading-relaxed', comment.isDeleted && 'italic text-slate-400')}>
              {comment.body}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <CommentVoteControls
                commentId={comment.id}
                postId={postId}
                score={comment.score}
                viewerVote={comment.viewerVote}
              />
              {!comment.isDeleted && (
                <button
                  type="button"
                  onClick={() => setShowReply((prev) => !prev)}
                  className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-500 transition hover:bg-brand-50 hover:text-brand-600"
                >
                  {showReply ? 'Cancel reply' : 'Reply'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReply && (
        <div className="ml-12">
          <CommentComposer
            postId={postId}
            parentId={comment.id}
            autoFocus
            onSubmitted={() => setShowReply(false)}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}

      {hasReplies && (
        <div className="ml-6 border-l border-slate-200 pl-6">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
