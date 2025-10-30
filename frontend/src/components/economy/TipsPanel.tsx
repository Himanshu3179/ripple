import { useState } from 'react';
import TipButton from './TipButton';

const TipsPanel = () => {
  const [recipient, setRecipient] = useState('');

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-slate-600">Recipient user id</label>
        <input
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Paste user id"
        />
      </div>
      {recipient && <TipButton recipientId={recipient} />}
      <p className="text-xs text-slate-400">Use this panel to tip creators while we build profile picker UI.</p>
    </div>
  );
};

export default TipsPanel;
