import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { TbArrowBackUp, TbBolt } from 'react-icons/tb';
import dayjs from '../../utils/date';
import useAuth from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';
import { addStoryverseScene, fetchStoryverseStory } from '../../lib/storyverse';
import type { StoryverseSceneNode } from '../../types';

const StoryverseDetailPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const storyQuery = useQuery({
    queryKey: ['storyverse', 'story', storyId],
    queryFn: () => fetchStoryverseStory(storyId ?? ''),
    enabled: Boolean(storyId),
  });

  const addSceneMutation = useMutation({
    mutationFn: ({ story, payload }: { story: string; payload: { parentSceneId?: string | null; choiceLabel?: string; content: string } }) =>
      addStoryverseScene(story, payload),
    onSuccess: () => {
      setActiveParentId(null);
      queryClient.invalidateQueries({ queryKey: ['storyverse', 'story', storyId] });
    },
  });

  if (!storyId) {
    return null;
  }

  const story = storyQuery.data?.story;
  const scenes = storyQuery.data?.scenes ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/storyverse')}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        <TbArrowBackUp className="text-base" /> Back to stories
      </button>

      {storyQuery.isLoading ? (
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      ) : !story ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500">
          Story not found or unavailable.
        </div>
      ) : (
        <>
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">{story.title}</h1>
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
              <p className="text-xs text-slate-400">
                Updated {story.updatedAt ? dayjs(story.updatedAt).fromNow() : 'just now'}
              </p>
            </div>
          </article>

          <section className="space-y-4">
            {scenes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                This story does not have scenes yet.
              </div>
            ) : (
              scenes.map((scene) => (
                <SceneNodeCard
                  key={scene.id}
                  scene={scene}
                  depth={scene.depth}
                  onAddBranch={(id) => setActiveParentId(id)}
                  isAuthenticated={isAuthenticated}
                />
              ))
            )}
          </section>

          <AddSceneModal
            open={Boolean(activeParentId)}
            isSubmitting={addSceneMutation.isPending}
            onClose={() => setActiveParentId(null)}
            onSubmit={(payload) =>
              addSceneMutation.mutate({
                story: storyId,
                payload: { ...payload, parentSceneId: activeParentId },
              })
            }
          />
        </>
      )}
    </div>
  );
};

interface SceneNodeCardProps {
  scene: StoryverseSceneNode;
  depth: number;
  onAddBranch: (sceneId: string) => void;
  isAuthenticated: boolean;
}

const SceneNodeCard = ({ scene, depth, onAddBranch, isAuthenticated }: SceneNodeCardProps) => {
  const leftPadding = Math.min(depth, 6) * 12;

  return (
    <div
      className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card"
      style={{
        marginLeft: leftPadding,
        borderLeft: depth > 0 ? '2px solid rgba(226, 232, 240, 1)' : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {scene.choiceLabel && (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Choice: {scene.choiceLabel}
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm text-slate-700">{scene.content}</p>
        </div>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => onAddBranch(scene.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-100"
          >
            <TbBolt className="text-sm" /> Branch
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Depth {scene.depth}</span>
        <span>{scene.createdAt ? dayjs(scene.createdAt).fromNow() : ''}</span>
      </div>
      {scene.children.length > 0 && (
        <div className="space-y-3 border-l border-dashed border-slate-200 pl-4">
          {scene.children.map((child) => (
            <SceneNodeCard
              key={child.id}
              scene={child}
              depth={child.depth}
              onAddBranch={onAddBranch}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface AddSceneModalProps {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (payload: { choiceLabel?: string; content: string }) => void;
}

const AddSceneModal = ({ open, onClose, isSubmitting, onSubmit }: AddSceneModalProps) => {
  const [choiceLabel, setChoiceLabel] = useState('');
  const [content, setContent] = useState('');

  const reset = () => {
    setChoiceLabel('');
    setContent('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      choiceLabel: choiceLabel.trim() || undefined,
      content: content.trim(),
    });
    reset();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Branch the story"
      description="Add a new scene that continues from this point."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="scene-choice" className="text-sm font-semibold text-slate-600">
            Choice label (optional)
          </label>
          <input
            id="scene-choice"
            value={choiceLabel}
            onChange={(event) => setChoiceLabel(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="scene-content" className="text-sm font-semibold text-slate-600">
            Scene content
          </label>
          <textarea
            id="scene-content"
            required
            minLength={20}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={6}
            className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
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
            {isSubmitting ? 'Branching…' : 'Add scene'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StoryverseDetailPage;
