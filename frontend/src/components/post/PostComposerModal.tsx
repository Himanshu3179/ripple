import { useEffect, useState } from 'react';
import { HiOutlineSparkles } from 'react-icons/hi';
import Modal from '../common/Modal';
import PostComposerForm from './PostComposerForm';
import AiComposerModal from './AiComposerModal';

interface PostComposerModalProps {
  open: boolean;
  onClose: () => void;
  seedTopic?: string;
  seedCommunity?: string;
}

const PostComposerModal = ({ open, onClose, seedTopic, seedCommunity }: PostComposerModalProps) => {
  const [isAiComposerOpen, setAiComposerOpen] = useState(false);
  const [prefill, setPrefill] = useState({ title: '', body: '', topic: '' });

  useEffect(() => {
    if (!open) {
      setPrefill({ title: '', body: '', topic: '' });
    } else if (seedTopic) {
      setPrefill((prev) => ({ ...prev, topic: seedTopic }));
    }
  }, [open, seedTopic]);

  const handleApplyAiDraft = (title: string, body: string) => {
    setPrefill((prev) => ({ ...prev, title, body }));
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Create a post"
        description="Share something insightful with the community."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-100 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Starforge AI</p>
            <p className="text-xs text-slate-500">
              Need inspiration? Let Starforge craft a ready-to-post draft for you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAiComposerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <HiOutlineSparkles className="text-base" />
            Summon draft
          </button>
        </div>
        <PostComposerForm
          onClose={onClose}
          initialTitle={prefill.title}
          initialBody={prefill.body}
          initialTopic={prefill.topic}
          seedCommunity={seedCommunity}
        />
      </Modal>
      <AiComposerModal
        open={isAiComposerOpen}
        onClose={() => setAiComposerOpen(false)}
        onApply={handleApplyAiDraft}
      />
    </>
  );
};

export default PostComposerModal;
