import clsx from 'clsx';
import { StarPack } from '../../../lib/billing';

interface StarPackCardProps {
  pack: StarPack;
  onSelect: (packId: string) => void;
}

const StarPackCard = ({ pack, onSelect }: StarPackCardProps) => {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">{pack.name}</h3>
        <p className="text-3xl font-bold text-brand-600">{pack.stars.toLocaleString()} ⭐</p>
        <p className="text-sm text-slate-500">₹{pack.priceINR.toLocaleString('en-IN')}</p>
        {typeof pack.bonusPercentage === 'number' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-600">
            +{pack.bonusPercentage}% bonus Stars
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onSelect(pack.id)}
        className={clsx(
          'mt-6 inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500',
        )}
      >
        Buy now
      </button>
    </div>
  );
};

export default StarPackCard;
