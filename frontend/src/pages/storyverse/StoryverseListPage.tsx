import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TbPlus, TbRefresh } from 'react-icons/tb';
import clsx from 'clsx';
import dayjs from '../../utils/date';
import useAuth from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';
import { createStoryverseStory, fetchStoryverseStories } from '../../lib/storyverse';
import type { StoryverseStorySummary } from '../../types';

const StoryverseListPage = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);

  const storiesQuery = useQuery({
    queryKey: ['storyverse', 'stories', search],
    queryFn: () => fetchStoryverseStories(search),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createStoryverseStory,
    onSuccess: (data) => {
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['storyverse', 'stories'] });
      navigate(`/storyverse/${data.story.id}`);
    },
  });

  const handleSubmitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const stories = storiesQuery.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Storyverse</h1>
            <p className="text-sm text-slate-500">
              Branching, collaborative stories powered by Ripple creators.
            </p>
          </div>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              <TbPlus className="text-base" />
              New story
            </button>
          )}
        </div>
        <form onSubmit={handleSubmitSearch} className="flex items-center gap-3">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search stories or tags"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
          <button
            type="submit"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => storiesQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            <TbRefresh className={clsx('text-base', storiesQuery.isFetching && 'animate-spin')} />
            Refresh
          </button>
        </form>
      </header>

      {storiesQuery.isLoading ? (
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500">
          No stories yet. Be the first to craft a branching narrative!
        </div>
      ) : (
        <div className="grid gap-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} onOpen={() => navigate(`/storyverse/${story.id}`)} />
          ))}
        </div>
      )}

      <CreateStoryModal
        open={isCreateOpen}
        isSubmitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </div>
  );
};

interface StoryCardProps {
  story: StoryverseStorySummary;
  onOpen: () => void;
}

const StoryCard = ({ story, onOpen }: StoryCardProps) => {
  return (
    <article
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900">{story.title}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {story.visibility}
          </span>
        </div>
        {story.summary && <p className="text-sm text-slate-600">{story.summary}</p>}
        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            {story.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Updated {story.updatedAt ? dayjs(story.updatedAt).fromNow() : 'just now'}</span>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-xl border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Open story
          </button>
        </div>
      </div>
    </article>
  );
};

interface CreateStoryModalProps {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (payload: {
    title: string;
    summary?: string;
    openingScene: string;
    tags?: string[];
    visibility?: 'public' | 'community' | 'private';
  }) => void;
}

const CreateStoryModal = ({ open, onClose, isSubmitting, onSubmit }: CreateStoryModalProps) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [openingScene, setOpeningScene] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'community' | 'private'>('public');

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setTags('');
    setOpeningScene('');
    setVisibility('public');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      title: title.trim(),
      summary: summary.trim(),
      openingScene,
      tags: tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      visibility,
    });
    resetForm();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isSubmitting) {
          resetForm();
          onClose();
        }
      }}
      title="Create a new story"
      description="Lay the foundations of a collaborative narrative."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="story-title" className="text-sm font-semibold text-slate-600">
            Title
          </label>
          <input
            id="story-title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="story-summary" className="text-sm font-semibold text-slate-600">
            Summary
          </label>
          <textarea
            id="story-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="story-tags" className="text-sm font-semibold text-slate-600">
            Tags (comma separated)
          </label>
          <input
            id="story-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="story-visibility" className="text-sm font-semibold text-slate-600">
            Visibility
          </label>
          <select
            id="story-visibility"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as typeof visibility)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          >
            <option value="public">Public</option>
            <option value="community">Community</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="story-opening" className="text-sm font-semibold text-slate-600">
            Opening scene
          </label>
          <textarea
            id="story-opening"
            required
            minLength={40}
            value={openingScene}
            onChange={(event) => setOpeningScene(event.target.value)}
            rows={6}
            className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (!isSubmitting) {
                resetForm();
                onClose();
              }
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating…' : 'Publish story'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StoryverseListPage;
