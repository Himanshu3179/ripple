import api from './api';
import type {
  AdminCommunitySummary,
  AdminUserSummary,
  AuditLogEntry,
  ReportResource,
  ReportStatus,
} from '../types';

interface RawReporter {
  _id: string;
  username: string;
  displayName: string;
}

interface RawReport {
  _id: string;
  targetType: ReportResource['targetType'];
  targetId: string;
  reason: string;
  status: ReportStatus;
  reporter?: RawReporter | null;
  community?: string | null;
  moderator?: string | null;
  resolutionNote?: string;
  createdAt: string;
  updatedAt?: string;
}

interface RawAuditLog {
  _id: string;
  actor?: { _id: string; username: string } | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface RawAdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  membershipTier: 'free' | 'star-pass' | 'star-unlimited';
  starsBalance: number;
  createdAt: string | null;
}

interface RawAdminCommunity {
  id: string;
  name: string;
  slug: string;
  visibility: 'public' | 'restricted' | 'private';
  memberCount: number;
  createdAt: string | null;
}

const mapReport = (raw: RawReport): ReportResource => ({
  id: raw._id,
  targetType: raw.targetType,
  targetId: raw.targetId,
  reason: raw.reason,
  status: raw.status,
  reporter: raw.reporter
    ? {
        id: raw.reporter._id,
        username: raw.reporter.username,
        displayName: raw.reporter.displayName,
      }
    : null,
  communityId: raw.community ?? null,
  moderatorId: raw.moderator ?? null,
  resolutionNote: raw.resolutionNote,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const mapAuditLog = (raw: RawAuditLog): AuditLogEntry => ({
  id: raw._id,
  actor: raw.actor
    ? {
        id: raw.actor._id,
        username: raw.actor.username,
      }
    : null,
  action: raw.action,
  targetType: raw.targetType,
  targetId: typeof raw.targetId === 'string' ? raw.targetId : (raw.targetId as string | undefined),
  metadata: raw.metadata ?? undefined,
  createdAt: raw.createdAt,
});

export const fetchReports = async (status: 'open' | 'reviewing' | 'resolved' | 'dismissed' | 'all' = 'open') => {
  const { data } = await api.get<{ reports: RawReport[] }>('/admin/reports', {
    params: status === 'all' ? {} : { status },
  });
  return data.reports.map(mapReport);
};

export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus,
  resolutionNote?: string,
): Promise<ReportResource> => {
  const { data } = await api.post<{ report: RawReport }>(`/admin/reports/${reportId}/status`, {
    status,
    resolutionNote,
  });
  return mapReport(data.report);
};

export const fetchAuditLogs = async () => {
  const { data } = await api.get<{ logs: RawAuditLog[] }>('/admin/audit-logs');
  return data.logs.map(mapAuditLog);
};

export const fetchAdminUsers = async (search?: string) => {
  const params = new URLSearchParams();
  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  }
  const query = params.toString();
  const path = query ? `/admin/users?${query}` : '/admin/users';
  const { data } = await api.get<{ users: RawAdminUser[] }>(path);
  return data.users as AdminUserSummary[];
};

export const updateAdminUserRole = async (userId: string, role: 'user' | 'admin') => {
  const { data } = await api.post<{ user: RawAdminUser }>(`/admin/users/${userId}/role`, { role });
  return data.user as AdminUserSummary;
};

export const fetchAdminCommunities = async (search?: string) => {
  const params = new URLSearchParams();
  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  }
  const query = params.toString();
  const path = query ? `/admin/communities?${query}` : '/admin/communities';
  const { data } = await api.get<{ communities: RawAdminCommunity[] }>(path);
  return data.communities as AdminCommunitySummary[];
};

export const updateAdminCommunityVisibility = async (
  communityId: string,
  visibility: 'public' | 'restricted' | 'private',
) => {
  const { data } = await api.post<{ community: RawAdminCommunity }>(
    `/admin/communities/${communityId}/visibility`,
    { visibility },
  );
  return data.community as AdminCommunitySummary;
};
