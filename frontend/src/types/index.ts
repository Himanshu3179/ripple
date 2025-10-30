export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarColor?: string;
  bio?: string;
  starsBalance: number;
  membershipTier: 'free' | 'star-pass' | 'star-unlimited';
  membershipExpiresAt?: string | null;
  aiPostQuota?: {
    limit: number;
    used: number;
    renewsAt: string;
  } | null;
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorSummary {
  id: string;
  username: string;
  displayName: string;
  avatarColor?: string;
}

export interface PostResource {
  id: string;
  title: string;
  body: string;
  topic: string;
  imageUrl: string;
  commentCount: number;
  score: number;
  boostScore: number;
  boostedUntil: string | null;
  createdAt?: string;
  updatedAt?: string;
  author: AuthorSummary | null;
  community?: {
    id: string;
    name: string;
    slug: string;
    visibility: string;
  } | null;
  viewerVote?: number;
}

export interface CommentResource {
  id: string;
  postId: string;
  body: string;
  isDeleted: boolean;
  parentComment: string | null;
  createdAt?: string;
  updatedAt?: string;
  score: number;
  author: AuthorSummary | null;
  viewerVote?: number;
  replies: CommentResource[];
}

export interface AuthResponse {
  token: string;
  user: AuthenticatedUser;
}

export type NotificationType =
  | 'tip-received'
  | 'referral-signup'
  | 'referral-subscription'
  | 'mission-completed'
  | 'post-removed';

export interface NotificationResource {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  read: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportTargetType = 'post' | 'comment' | 'user';

export interface ReportResource {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  reporter: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  communityId?: string | null;
  moderatorId?: string | null;
  resolutionNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  actor?: {
    id: string;
    username: string;
  } | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  membershipTier: 'free' | 'star-pass' | 'star-unlimited';
  starsBalance: number;
  createdAt: string | null;
}

export interface AdminCommunitySummary {
  id: string;
  name: string;
  slug: string;
  visibility: 'public' | 'restricted' | 'private';
  memberCount: number;
  createdAt: string | null;
}

export interface StoryverseStorySummary {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  visibility: 'public' | 'community' | 'private';
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface StoryverseSceneNode {
  id: string;
  storyId: string;
  authorId: string;
  parentSceneId: string | null;
  choiceLabel: string | null;
  content: string;
  depth: number;
  createdAt: string | null;
  children: StoryverseSceneNode[];
}
