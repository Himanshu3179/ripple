import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import useAuth from '../../hooks/useAuth';
import api from '../../lib/api';
import type { CommentResource } from '../../types';

interface CommentComposerProps {
  postId: string;
  parentId?: string | null;
  autoFocus?: boolean;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

interface CreateCommentPayload {
  body: string;
  parentId?: string | null;
}

const CommentComposer = ({
  postId,
  parentId = null,
  autoFocus = false,
  onSubmitted,
  onCancel,
}: CommentComposerProps) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const isValid = body.trim().length >= 3;

  const { mutateAsync, isPending } = useMutation<CommentResource, unknown, CreateCommentPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ comment: CommentResource }>(
        `/posts/${postId}/comments`,
        payload,
      );
      return data.comment;
    },
    onSuccess: () => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      setBody('');
      onSubmitted?.();
    },
    onError: (error) => {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Unable to add comment'
        : 'Unable to add comment';
      toast.error(message);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || isPending) return;
    await mutateAsync({
      body: body.trim(),
      parentId,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
        <p className="text-sm font-medium text-slate-600">Sign in to join the discussion.</p>
        <div className="mt-3 flex justify-center gap-3 text-sm font-semibold">
          <a className="rounded-xl border border-brand-200 px-4 py-2 text-brand-600" href="/login">
            Log in
          </a>
          <a className="rounded-xl bg-brand-500 px-4 py-2 text-white shadow-sm" href="/register">
            Sign up
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <textarea
        autoFocus={autoFocus}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Share your thoughts..."
        rows={3}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
      />
      <div className="mt-3 flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isPending}
          className={clsx(
            'rounded-xl bg-brand-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition focus:outline-none focus:ring-2 focus:ring-brand-500',
            (!isValid || isPending) && 'cursor-not-allowed opacity-60',
          )}
        >
          {isPending ? 'Posting…' : 'Post comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentComposer;
