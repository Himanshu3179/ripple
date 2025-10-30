import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiMiniBolt } from 'react-icons/hi2';
import { boostPost } from '../../lib/economy';
import useAuth from '../../hooks/useAuth';
import Modal from '../common/Modal';
import { POST_BOOST_COST, POST_BOOST_DURATION_HOURS } from '../../config/economy';

interface BoostButtonProps {
  postId: string;
}

const BoostButton = ({ postId }: BoostButtonProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { isAuthenticated, refreshAccount, user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => boostPost(postId),
    onSuccess: (data) => {
      toast.success('Post boosted');
      refreshAccount();
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setModalOpen(false);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Unable to boost post');
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const closeModal = () => {
    if (mutation.isPending) return;
    setModalOpen(false);
  };

  const handleConfirm = () => {
    mutation.mutate();
  };

  const balance = user?.starsBalance ?? 0;
  const hasEnough = balance >= POST_BOOST_COST;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100"
      >
        <HiMiniBolt className="text-base" />
        Boost Post
      </button>
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Boost this post"
        description="Give your post a burst of visibility across Ripple."
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <HiMiniBolt className="mt-0.5 text-lg" />
            <p>
              Boosts highlight your post for{' '}
              <span className="font-semibold">{POST_BOOST_DURATION_HOURS} hours</span> and push it higher in the feed.
            </p>
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <p>
              Boost cost:{' '}
              <span className="font-semibold text-amber-600">{POST_BOOST_COST.toLocaleString()} Stars</span>
            </p>
            <p>
              Your balance:{' '}
              <span className="font-semibold text-slate-700">{balance.toLocaleString()} Stars</span>
            </p>
            {!hasEnough && (
              <p className="text-xs text-red-500">
                You need {(POST_BOOST_COST - balance).toLocaleString()} more Stars to boost this post.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/store"
              onClick={closeModal}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Get more Stars
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={mutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={mutation.isPending || !hasEnough}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? 'Boosting…' : `Boost for ${POST_BOOST_COST} ⭐`}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BoostButton;
