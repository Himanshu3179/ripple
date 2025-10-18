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
