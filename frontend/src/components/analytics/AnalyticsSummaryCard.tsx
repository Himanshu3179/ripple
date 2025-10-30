import { HiOutlineChatBubbleLeftRight, HiOutlineDocumentText } from 'react-icons/hi2';
import { AnalyticsSummary } from '../../lib/analytics';

const AnalyticsSummaryCard = ({ data }: { data: AnalyticsSummary }) => (
  <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card md:grid-cols-2">
    <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
      <div className="rounded-xl bg-brand-500/10 p-2 text-brand-600">
        <HiOutlineDocumentText className="text-2xl" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Posts</h3>
        <p className="text-sm text-slate-500">{data.posts} published • {data.postComments} comments received</p>
        <p className="mt-1 text-sm font-semibold text-brand-600">Score: {data.postScore}</p>
      </div>
    </div>
    <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
      <div className="rounded-xl bg-brand-500/10 p-2 text-brand-600">
        <HiOutlineChatBubbleLeftRight className="text-2xl" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Comments</h3>
        <p className="text-sm text-slate-500">{data.comments} replies shared</p>
        <p className="mt-1 text-sm font-semibold text-brand-600">Score: {data.commentScore}</p>
      </div>
    </div>
  </section>
);

export default AnalyticsSummaryCard;
