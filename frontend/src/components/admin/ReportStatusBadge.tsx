import clsx from 'clsx';
import type { ReportStatus } from '../../types';

interface ReportStatusBadgeProps {
  status: ReportStatus;
}

const statusStyles: Record<ReportStatus, string> = {
  open: 'bg-red-50 text-red-600 border-red-200',
  reviewing: 'bg-amber-50 text-amber-600 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
};

const labelMap: Record<ReportStatus, string> = {
  open: 'Open',
  reviewing: 'In review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const ReportStatusBadge = ({ status }: ReportStatusBadgeProps) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        statusStyles[status],
      )}
    >
      {labelMap[status]}
    </span>
  );
};

export default ReportStatusBadge;
