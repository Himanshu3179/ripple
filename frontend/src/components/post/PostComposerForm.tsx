import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph } from 'react-icons/hi';
import clsx from 'clsx';
import useAuth from '../../hooks/useAuth';
import api from '../../lib/api';
import type { PostResource } from '../../types';
import { useMyCommunities } from '../../hooks/useCommunities';

interface CreatePostPayload {
  title: string;
  topic: string;
  body: string;
  imageUrl: string;
  communityId?: string;
}

interface PostComposerFormProps {
  onClose?: () => void;
  initialTitle?: string;
  initialBody?: string;
  initialTopic?: string;
  seedCommunity?: string;
}

const PostComposerForm = ({
  onClose,
  initialTitle = '',
  initialBody = '',
  initialTopic = '',
  seedCommunity,
}: PostComposerFormProps) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: communities } = useMyCommunities();
  const [title, setTitle] = useState(initialTitle);
  const [topic, setTopic] = useState(initialTopic);
  const [body, setBody] = useState(initialBody);
  const [imageUrl, setImageUrl] = useState('');
  const [communityId, setCommunityId] = useState<string>('');

  useEffect(() => {
    setTitle(initialTitle);
    setTopic(initialTopic);
    setBody(initialBody);
  }, [initialTitle, initialBody, initialTopic]);

  useEffect(() => {
    if (seedCommunity && communities) {
      const match = communities.find((community) => community.slug === seedCommunity || community.id === seedCommunity);
      if (match) {
        setCommunityId(match.id);
      }
    }
  }, [seedCommunity, communities]);

  const isFormValid = title.trim().length >= 3 && topic.trim().length >= 2;

  const { mutateAsync, isPending } = useMutation<PostResource, unknown, CreatePostPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ post: PostResource }>('/posts', payload);
      return data.post;
    },
    onSuccess: () => {
      toast.success('Post published');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setTitle('');
      setTopic('');
      setBody('');
      setImageUrl('');
      onClose?.();
    },
    onError: (error) => {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Unable to publish post'
        : 'Unable to publish post';
      toast.error(message);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || isPending) return;

    await mutateAsync({
      title: title.trim(),
      topic: topic.trim(),
      body: body.trim(),
      imageUrl: imageUrl.trim(),
      communityId: communityId || undefined,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Join the conversation</h2>
        <p className="text-sm text-slate-500">
          Sign in to share updates, ask questions, and vote on posts from the community.
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="/login"
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Log in
          </a>
            <a
            href="/register"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            Create account
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4"
    >
      <div>
        <label htmlFor="topic" className="text-sm font-semibold text-slate-600">
          Topic
        </label>
        <input
          id="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="e.g. javascript, design, startups"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
        />
      </div>


      {communities && (
        <div>
          <label className="text-sm font-semibold text-slate-600">Community</label>
          <select
            value={communityId}
            onChange={(event) => setCommunityId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          >
            <option value="">Personal feed</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="title" className="text-sm font-semibold text-slate-600">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Give your post a descriptive title"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
        />
      </div>

      <div>
        <label htmlFor="body" className="text-sm font-semibold text-slate-600">
          Details
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write your thoughts, questions, or insights..."
          rows={4}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
        />
      </div>

      <div>
        <label htmlFor="imageUrl" className="text-sm font-semibold text-slate-600">
          Cover image (optional)
        </label>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <HiOutlinePhotograph className="text-lg text-slate-400" />
          <input
            id="imageUrl"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://example.com/your-image.jpg"
            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={() => {
              setTitle(initialTitle);
              setTopic(initialTopic);
              setBody(initialBody);
              setImageUrl('');
              onClose();
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setTitle('');
            setTopic('');
            setBody('');
            setImageUrl('');
          }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={!isFormValid || isPending}
          className={clsx(
            'rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500',
            (!isFormValid || isPending) && 'cursor-not-allowed opacity-60',
          )}
        >
          {isPending ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  );
};

export default PostComposerForm;
