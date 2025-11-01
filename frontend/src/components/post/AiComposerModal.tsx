import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { composePost } from '../../lib/ai';
import useAuth from '../../hooks/useAuth';

interface AiComposerModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (title: string, body: string, topic: string) => void;
}

const toneOptions = ['Inspiring', 'Playful', 'Analytical', 'Casual', 'Bold'];

const AiComposerModal = ({ open, onClose, onApply }: AiComposerModalProps) => {
  const { refreshAccount } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<string>('');
  const [outline, setOutline] = useState<string>('');

  const { mutateAsync, isPending } = useMutation({
    mutationFn: composePost,
    onSuccess: (data) => {
      onApply(data.title, data.body, data.topic);
      toast.success('Starforge draft ready!');
      void refreshAccount();
      onClose();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Unable to generate post. Try again later.');
    },
  });

  const handleGenerate = async () => {
    if (prompt.trim().length < 10) {
      toast.error('Describe your idea with at least 10 characters.');
      return;
    }

    await mutateAsync({
      prompt,
      tone,
      outline: outline
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Starforge AI Composer"
      description="Describe what you want to talk about and let Starforge craft a stellar post."
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="aiPrompt" className="text-sm font-semibold text-slate-600">
            Prompt
          </label>
          <textarea
            id="aiPrompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Explain the topic, context, and any must-have points..."
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-600">Tone</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {toneOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTone((prev) => (prev === option ? '' : option))}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${tone === option ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="outline" className="text-sm font-semibold text-slate-600">
            Outline (optional)
          </label>
          <textarea
            id="outline"
            value={outline}
            onChange={(event) => setOutline(event.target.value)}
            placeholder={'Intro: Why this matters\nIdea 1: Key point\nIdea 2: Supporting detail\nOutro: Call to action'}
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className={`rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${isPending ? 'cursor-not-allowed opacity-60' : 'hover:bg-brand-600'}`}
          >
            {isPending ? 'Summoning…' : 'Generate with Stars'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AiComposerModal;
