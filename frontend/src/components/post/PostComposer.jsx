import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph } from 'react-icons/hi';
import clsx from 'clsx';
import useAuth from '../../hooks/useAuth.js';
import api from '../../lib/api.js';

const PostComposer = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const isFormValid = title.trim().length >= 3 && topic.trim().length >= 2;

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/posts', payload);
      return data.post;
    },
    onSuccess: () => {
      toast.success('Post published');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setTitle('');
      setTopic('');
      setBody('');
      setImageUrl('');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Unable to publish post';
      toast.error(message);
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFormValid || isPending) return;

    await mutateAsync({
      title: title.trim(),
      topic: topic.trim(),
      body: body.trim(),
      imageUrl: imageUrl.trim(),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Join the conversation</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to share updates, ask questions, and vote on posts from the community.
        </p>
        <div className="mt-4 flex gap-3">
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
      id="post-composer"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
    >
      <h2 className="text-lg font-semibold text-slate-900">Create a post</h2>
      <p className="mt-1 text-sm text-slate-500">Share something insightful with the community.</p>

      <div className="mt-4 grid gap-4">
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
      </div>

      <div className="mt-5 flex justify-end gap-2">
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

export default PostComposer;
