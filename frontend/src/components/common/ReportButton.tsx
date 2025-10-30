import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuth from '../../hooks/useAuth';

interface ReportButtonProps {
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
}

const ReportButton = ({ targetType, targetId }: ReportButtonProps) => {
  const { isAuthenticated } = useAuth();
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/reports', { targetType, targetId, reason }),
    onSuccess: () => {
      toast.success('Report submitted. Thank you for keeping Ripple safe.');
      setReason('');
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Unable to submit report');
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
      >
        Report
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            placeholder="Describe the issue"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-slate-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={reason.trim().length < 10 || mutation.isPending}
              className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportButton;
