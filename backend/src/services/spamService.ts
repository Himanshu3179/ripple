type SubmissionType = 'post' | 'comment';

interface SpamCheckOptions {
  type: SubmissionType;
  userId: string;
  content: string;
}

interface SubmissionEntry {
  hash: string;
  timestamp: number;
}

type SpamCheckResult =
  | { allowed: true }
  | { allowed: false; message: string };

const spamWindows: Record<SubmissionType, { windowMs: number; maxDuplicates: number; maxEntries: number }> = {
  post: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxDuplicates: 1,
    maxEntries: 6,
  },
  comment: {
    windowMs: 2 * 60 * 1000, // 2 minutes
    maxDuplicates: 2,
    maxEntries: 12,
  },
};

const submissions = new Map<string, SubmissionEntry[]>();

const normalizeContent = (raw: string) => raw.replace(/\s+/g, ' ').trim().toLowerCase();

export const checkSpamSubmission = ({ type, userId, content }: SpamCheckOptions): SpamCheckResult => {
  const config = spamWindows[type];
  const normalizedContent = normalizeContent(content || '');

  if (!normalizedContent) {
    return { allowed: true };
  }

  const key = `${type}:${userId}`;
  const now = Date.now();
  const existing = submissions.get(key) ?? [];
  const recent = existing.filter((entry) => now - entry.timestamp < config.windowMs);
  const duplicateCount = recent.filter((entry) => entry.hash === normalizedContent).length;

  if (duplicateCount >= config.maxDuplicates) {
    const message =
      type === 'post'
        ? 'You recently shared a very similar post. Please wait before posting it again.'
        : 'You recently posted the same comment. Please avoid repeating yourself.';
    return { allowed: false, message };
  }

  recent.push({ hash: normalizedContent, timestamp: now });
  if (recent.length > config.maxEntries) {
    recent.splice(0, recent.length - config.maxEntries);
  }
  submissions.set(key, recent);

  if (type === 'comment') {
    const linkCount = (content.match(/https?:\/\//gi) || []).length;
    if (linkCount > 3) {
      return {
        allowed: false,
        message: 'Too many links in a single comment. This may be considered spam.',
      };
    }
  }
  return { allowed: true };
};
