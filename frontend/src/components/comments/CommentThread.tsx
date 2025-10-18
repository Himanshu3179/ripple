import CommentItem from './CommentItem';
import type { CommentResource } from '../../types';

interface CommentThreadProps {
  comments: CommentResource[];
  postId: string;
}

const CommentThread = ({ comments, postId }: CommentThreadProps) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Be the first to start the conversation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  );
};

export default CommentThread;
