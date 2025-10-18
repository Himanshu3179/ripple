import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import clsx from 'clsx';
import { HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import api from '../../lib/api';
import type { PostResource } from '../../types';

interface VoteControlsProps {
  postId: string;
  score: number;
  viewerVote?: number;
}

type VoteValue = 1 | 0 | -1;

const VoteControls = ({ postId, score, viewerVote }: VoteControlsProps) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { mutate } = useMutation<PostResource, unknown, VoteValue>({
    mutationFn: async (value) => {
      const { data } = await api.post<{ post: PostResource }>(`/posts/${postId}/vote`, { value });
      return data.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: (error) => {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Unable to submit vote'
        : 'Unable to submit vote';
      toast.error(message);
    },
  });

  const handleVote = (value: VoteValue) => {
    if (!isAuthenticated) {
      toast.error('Sign in to vote on posts');
      return;
    }

    let nextValue = value;
    if (viewerVote === value) {
      nextValue = 0;
    }
    mutate(nextValue);
  };

  return (
    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-sm font-semibold">
      <button
        type="button"
        onClick={() => handleVote(1)}
        className={clsx(
          'grid h-8 w-8 place-items-center rounded-full transition',
          viewerVote === 1 ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-200',
        )}
      >
        <HiOutlineArrowUp className="text-lg" />
      </button>
      <span className="min-w-[2rem] text-center text-base font-semibold text-slate-700">
        {score}
      </span>
      <button
        type="button"
        onClick={() => handleVote(-1)}
        className={clsx(
          'grid h-8 w-8 place-items-center rounded-full transition',
          viewerVote === -1 ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200',
        )}
      >
        <HiOutlineArrowDown className="text-lg" />
      </button>
    </div>
  );
};

export default VoteControls;
