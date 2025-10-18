interface TopicBadgeProps {
  topic: string;
}

const TopicBadge = ({ topic }: TopicBadgeProps) => {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className="h-2 w-2 rounded-full bg-brand-400" />
      {topic}
    </span>
  );
};

export default TopicBadge;
