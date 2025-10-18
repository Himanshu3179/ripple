export const STARFORGE_EXTRA_DRAFT_COST = 25;
export const POST_BOOST_COST = 50;
export const POST_BOOST_DURATION_HOURS = 12;

export type StarLedgerEntryType =
  | 'purchase'
  | 'membership'
  | 'reward'
  | 'referral'
  | 'tip-sent'
  | 'tip-received'
  | 'ai-draft'
  | 'post-boost';
