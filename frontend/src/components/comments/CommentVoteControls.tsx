import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import api from '../../lib/api';
import type { CommentResource } from '../../types';

interface CommentVoteControlsProps {
  commentId: string;
  postId: string;
  score: number;
  viewerVote?: number;
}

type VoteValue = 1 | 0 | -1;

const CommentVoteControls = ({
  commentId,
  postId,
  score,
  viewerVote,
}: CommentVoteControlsProps) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { mutate } = useMutation<CommentResource, unknown, VoteValue>({
    mutationFn: async (value) => {
      const { data } = await api.post<{ comment: CommentResource }>(`/comments/${commentId}/vote`, {
        value,
      });
      return data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (error) => {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Unable to update vote'
        : 'Unable to update vote';
      toast.error(message);
    },
  });

  const handleVote = (value: VoteValue) => {
    if (!isAuthenticated) {
      toast.error('Sign in to vote on comments');
      return;
    }

    let nextValue = value;
    if (viewerVote === value) {
      nextValue = 0;
    }
    mutate(nextValue);
  };

  return (
    <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
      <button
        type="button"
        onClick={() => handleVote(1)}
        className={clsx(
          'grid h-7 w-7 place-items-center rounded-full transition',
          viewerVote === 1 ? 'bg-brand-500 text-white' : 'hover:bg-slate-200',
        )}
      >
        <HiOutlineArrowUp className="text-base" />
      </button>
      <span className="px-1">{score}</span>
      <button
        type="button"
        onClick={() => handleVote(-1)}
        className={clsx(
          'grid h-7 w-7 place-items-center rounded-full transition',
          viewerVote === -1 ? 'bg-slate-800 text-white' : 'hover:bg-slate-200',
        )}
      >
        <HiOutlineArrowDown className="text-base" />
      </button>
    </div>
  );
};

export default CommentVoteControls;
