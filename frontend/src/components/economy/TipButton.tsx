import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { tipUser } from '../../lib/economy';
import useAuth from '../../hooks/useAuth';
import Modal from '../common/Modal';

interface TipButtonProps {
  recipientId: string;
  postId?: string;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

const TipButton = ({ recipientId, postId }: TipButtonProps) => {
  const [amount, setAmount] = useState<number>(PRESET_AMOUNTS[0]);
  const [isModalOpen, setModalOpen] = useState(false);
  const { isAuthenticated, refreshAccount, user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => tipUser({ recipientId, stars: amount, postId }),
    onSuccess: () => {
      toast.success('Tip sent');
      refreshAccount();
      queryClient.invalidateQueries({ queryKey: ['economy', 'ledger'] });
      setModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Unable to send tip');
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
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Choose a tip amount above zero');
      return;
    }
    mutation.mutate();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
      >
        Tip ⭐
      </button>
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Send a tip"
        description="Say thanks with Stars. Tips go straight to the creator."
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="tip-amount" className="text-sm font-semibold text-slate-600">
                Choose amount
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value)}
                    className={clsx(
                      'rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                      amount === value
                        ? 'border-brand-400 bg-brand-50 text-brand-600 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-500',
                    )}
                    disabled={mutation.isPending}
                  >
                    {value} ⭐
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <input
                id="tip-amount"
                type="number"
                min={1}
                value={Number.isFinite(amount) ? amount : ''}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition focus:border-brand-400 focus:ring focus:ring-brand-100"
                disabled={mutation.isPending}
              />
              <p className="text-xs text-slate-500">
                You&apos;ll spend{' '}
                <span className="font-semibold text-brand-600">{Number(amount).toLocaleString()}</span> Stars.
                Balance:{' '}
                <span className="font-semibold text-slate-600">
                  {(user?.starsBalance ?? 0).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
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
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? 'Sending…' : `Send ${amount} ⭐`}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TipButton;
