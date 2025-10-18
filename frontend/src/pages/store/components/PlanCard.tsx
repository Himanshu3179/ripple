import clsx from 'clsx';
import { HiOutlineSparkles } from 'react-icons/hi';
import { MembershipPlan } from '../../../lib/billing';

interface PlanCardProps {
  plan: MembershipPlan;
  selectedCadence: 'monthly' | 'yearly';
  onSelect: (tier: 'star-pass' | 'star-unlimited') => void;
  isCurrent: boolean;
}

const PlanCard = ({ plan, selectedCadence, onSelect, isCurrent }: PlanCardProps) => {
  const price = selectedCadence === 'yearly' ? plan.priceYearlyINR : plan.priceMonthlyINR;
  const cadenceLabel = selectedCadence === 'yearly' ? 'year' : 'month';

  return (
    <div
      className={clsx(
        'flex h-full flex-col justify-between rounded-3xl border bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lg',
        isCurrent ? 'border-brand-400 ring-2 ring-brand-200' : 'border-slate-200',
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
            <p className="text-sm text-slate-500 capitalize">Tier: {plan.tier.replace('-', ' ')}</p>
          </div>
          {plan.tier !== 'free' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
              <HiOutlineSparkles />
              +{plan.monthlyStars} Stars / month
            </span>
          )}
        </div>

        <div>
          <p className="text-3xl font-bold text-slate-900">
            ₹{price.toLocaleString('en-IN')}
            <span className="ml-1 text-base font-medium text-slate-500">/ {cadenceLabel}</span>
          </p>
          {selectedCadence === 'yearly' && plan.tier !== 'free' && (
            <p className="text-xs text-brand-500">Save {(1 - plan.priceYearlyINR / (plan.priceMonthlyINR * 12)) * 100}% annually</p>
          )}
        </div>

        <ul className="space-y-2 text-sm text-slate-600">
          {plan.features.map((feature) => (
            <li key={feature.key} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
              <span>{feature.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        disabled={plan.tier === 'free' || isCurrent}
        onClick={() => onSelect(plan.tier as 'star-pass' | 'star-unlimited')}
        className={clsx(
          'mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500',
          plan.tier === 'free'
            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
            : isCurrent
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-brand-500 text-white shadow-sm hover:bg-brand-600',
        )}
      >
        {plan.tier === 'free' ? 'Current plan' : isCurrent ? 'Active plan' : 'Upgrade'}
      </button>
    </div>
  );
};

export default PlanCard;
