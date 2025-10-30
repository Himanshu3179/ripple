import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TbRefresh, TbStars } from 'react-icons/tb';
import { HiOutlineShieldExclamation, HiOutlineUsers } from 'react-icons/hi2';
import clsx from 'clsx';
import dayjs from '../../utils/date';
import useAuth from '../../hooks/useAuth';
import {
  fetchAdminCommunities,
  fetchAdminUsers,
  fetchAuditLogs,
  fetchReports,
  updateAdminCommunityVisibility,
  updateAdminUserRole,
  updateReportStatus,
} from '../../lib/admin';
import type {
  AdminCommunitySummary,
  AdminUserSummary,
  AuditLogEntry,
  ReportResource,
  ReportStatus,
} from '../../types';
import ReportStatusBadge from '../../components/admin/ReportStatusBadge';

type AdminSection = 'reports' | 'audit' | 'users' | 'communities';

const adminSections: Array<{ key: AdminSection; label: string; description: string }> = [
  { key: 'reports', label: 'Reports', description: 'Review and resolve community reports.' },
  { key: 'audit', label: 'Audit log', description: 'Track moderator and system actions.' },
  { key: 'users', label: 'Users', description: 'Review member roles and balance adjustments.' },
  { key: 'communities', label: 'Communities', description: 'Manage community visibility and insights.' },
];

const reportStatusFilters: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'reviewing', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'all', label: 'All' },
];

const AdminPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const sectionParam = (searchParams.get('section') as AdminSection | null) ?? 'reports';
  const activeSection: AdminSection = adminSections.some((section) => section.key === sectionParam)
    ? sectionParam
    : 'reports';

  const handleSectionChange = (nextSection: AdminSection) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('section', nextSection);
      return params;
    });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin control center</h1>
            <p className="text-sm text-slate-500">
              Oversee community health, triage reports, and audit platform activity.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
            <TbStars className="text-base" />
            Admin access
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {adminSections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => handleSectionChange(section.key)}
              className={clsx(
                'flex min-w-[140px] flex-1 flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition',
                activeSection === section.key
                  ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-brand-200 hover:bg-brand-50/40 hover:text-brand-600',
              )}
            >
              <span className="text-sm font-semibold">{section.label}</span>
              <span className="text-xs">{section.description}</span>
            </button>
          ))}
        </nav>
      </header>

      {activeSection === 'reports' && <ReportsPanel />}
      {activeSection === 'audit' && <AuditLogPanel />}
      {activeSection === 'users' && <UsersPanel />}
      {activeSection === 'communities' && <CommunitiesPanel />}
    </div>
  );
};

const ReportsPanel = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('open');
  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports', statusFilter],
    queryFn: () => fetchReports(statusFilter),
    staleTime: 30_000,
  });

  type UpdatePayload = { reportId: string; status: ReportStatus; resolutionNote?: string };

  const mutation = useMutation({
    mutationFn: ({ reportId, status, resolutionNote }: UpdatePayload) =>
      updateReportStatus(reportId, status, resolutionNote),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  const handleStatusUpdate = async (report: ReportResource, nextStatus: ReportStatus) => {
    if (report.status === nextStatus) return;

    let resolutionNote: string | undefined;
    if (nextStatus === 'resolved' || nextStatus === 'dismissed') {
      const note = window.prompt('Add a resolution note (optional)');
      if (note && note.trim().length > 0) {
        resolutionNote = note.trim();
      }
    }

    mutation.mutate({ reportId: report.id, status: nextStatus, resolutionNote });
  };

  const reports = reportsQuery.data ?? [];
  const isLoading = reportsQuery.isLoading;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Community reports</h2>
          <p className="text-sm text-slate-500">
            Prioritize open reports, escalate to reviewing, and close them with helpful notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Status filter
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ReportStatus | 'all')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          >
            {reportStatusFilters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => reportsQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            <TbRefresh className={clsx('text-base', reportsQuery.isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : reports.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <HiOutlineShieldExclamation className="text-3xl text-brand-500" />
          <div>
            <p className="text-sm font-semibold text-slate-700">No reports in this bucket</p>
            <p className="text-xs text-slate-500">
              Triage stays quiet when the community is calm. Check back or switch status filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Report</th>
                <th className="px-4 py-3 text-left font-semibold">Reason</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-brand-50/40"
                >
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <span>{report.targetType}</span>
                        <span className="text-slate-200">•</span>
                        <span className="text-slate-500">
                          ID {report.targetId.slice(0, 6)}
                          …
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {report.reporter
                          ? `${report.reporter.displayName} (@${report.reporter.username})`
                          : 'Unknown reporter'}
                      </p>
                      {report.communityId && (
                        <p className="text-xs text-slate-500">
                          Community:{' '}
                          <span className="font-semibold text-slate-600">
                            {report.communityId}
                          </span>
                        </p>
                      )}
                      {report.resolutionNote && (
                        <p className="text-xs text-slate-400">Note: {report.resolutionNote}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="text-sm text-slate-600">{report.reason}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <ReportStatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-xs text-slate-500">
                      {dayjs(report.createdAt).format('MMM D, YYYY h:mm A')}
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">
                        {dayjs(report.createdAt).fromNow()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex flex-col items-end gap-2">
                      {(['open', 'reviewing', 'resolved', 'dismissed'] as ReportStatus[]).map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleStatusUpdate(report, statusOption);
                          }}
                          disabled={mutation.isPending && mutation.variables?.reportId === report.id}
                          className={clsx(
                            'w-full rounded-xl border px-3 py-1 text-xs font-semibold transition',
                            statusOption === report.status
                              ? 'border-brand-300 bg-brand-100 text-brand-700 cursor-default'
                              : 'border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600',
                          )}
                        >
                          {statusOption === report.status ? 'Current' : `Mark ${statusOption}`}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const AuditLogPanel = () => {
  const logsQuery = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: fetchAuditLogs,
    staleTime: 60_000,
  });

  const logs = logsQuery.data ?? ([] as AuditLogEntry[]);

  const renderMetadata = (metadata?: Record<string, unknown>) => {
    if (!metadata || Object.keys(metadata).length === 0) return '—';
    try {
      return JSON.stringify(metadata);
    } catch {
      return 'Metadata unavailable';
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Audit log</h2>
          <p className="text-sm text-slate-500">
            A chronological feed of moderator decisions and automated actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => logsQuery.refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          <TbRefresh className={clsx('text-base', logsQuery.isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {logsQuery.isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : logs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          No audit events yet. Moderator and system actions will appear here.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-brand-200/70 hover:bg-brand-50/40"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-500">
                    Actor:{' '}
                    <span className="font-semibold text-slate-600">
                      {log.actor ? `@${log.actor.username}` : 'System'}
                    </span>
                    {log.targetType && (
                      <>
                        {' '}
                        • Target: <span className="font-medium text-slate-500">{log.targetType}</span>
                        {log.targetId && <span className="text-slate-400"> ({log.targetId})</span>}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">Metadata: {renderMetadata(log.metadata)}</p>
                </div>
                <div className="text-xs text-slate-500">
                  {dayjs(log.createdAt).format('MMM D, YYYY h:mm A')}
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">
                    {dayjs(log.createdAt).fromNow()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminPage;

const UsersPanel = () => {
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', submittedSearch],
    queryFn: () => fetchAdminUsers(submittedSearch),
    staleTime: 30_000,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'user' | 'admin' }) =>
      updateAdminUserRole(userId, role),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<AdminUserSummary[] | undefined>(
        ['admin', 'users', submittedSearch],
        (previous) =>
          previous?.map((user) => (user.id === updatedUser.id ? updatedUser : user)) ?? previous,
      );
    },
  });

  const handleSubmitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedSearch(searchDraft.trim());
  };

  const users = usersQuery.data ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">User directory</h2>
          <p className="text-sm text-slate-500">
            Promote trusted members to admin status or audit top contributors.
          </p>
        </div>
        <form onSubmit={handleSubmitSearch} className="flex items-center gap-2">
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search by name, username, or email"
            className="w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
          <button
            type="submit"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => usersQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            <TbRefresh className={clsx('text-base', usersQuery.isFetching && 'animate-spin')} />
            Refresh
          </button>
        </form>
      </div>

      {usersQuery.isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : users.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          {submittedSearch ? 'No users match this search.' : 'No users found yet.'}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Profile</th>
                <th className="px-4 py-3 text-left font-semibold">Membership</th>
                <th className="px-4 py-3 text-left font-semibold">Stars</th>
                <th className="px-4 py-3 text-left font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {user.displayName}{' '}
                        <span className="text-xs font-medium text-slate-400">@{user.username}</span>
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {user.membershipTier.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">{user.starsBalance.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {user.createdAt ? dayjs(user.createdAt).format('MMM D, YYYY') : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {(['user', 'admin'] as const).map((roleOption) => (
                        <button
                          key={roleOption}
                          type="button"
                          onClick={() => updateRoleMutation.mutate({ userId: user.id, role: roleOption })}
                          disabled={
                            updateRoleMutation.isPending ||
                            user.role === roleOption
                          }
                          className={clsx(
                            'rounded-xl border px-3 py-1 text-xs font-semibold transition',
                            user.role === roleOption
                              ? 'border-brand-300 bg-brand-100 text-brand-700 cursor-default'
                              : 'border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600',
                          )}
                        >
                          {roleOption === 'admin' ? 'Promote' : 'Set user'}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const CommunitiesPanel = () => {
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const communitiesQuery = useQuery({
    queryKey: ['admin', 'communities', submittedSearch],
    queryFn: () => fetchAdminCommunities(submittedSearch),
    staleTime: 30_000,
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: ({
      communityId,
      visibility,
    }: {
      communityId: string;
      visibility: 'public' | 'restricted' | 'private';
    }) => updateAdminCommunityVisibility(communityId, visibility),
    onSuccess: (updatedCommunity) => {
      queryClient.setQueryData<AdminCommunitySummary[] | undefined>(
        ['admin', 'communities', submittedSearch],
        (previous) =>
          previous?.map((community) =>
            community.id === updatedCommunity.id ? updatedCommunity : community,
          ) ?? previous,
      );
    },
  });

  const handleSubmitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedSearch(searchDraft.trim());
  };

  const communities = communitiesQuery.data ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Communities</h2>
          <p className="text-sm text-slate-500">
            Vet community visibility and keep the ecosystem healthy.
          </p>
        </div>
        <form onSubmit={handleSubmitSearch} className="flex items-center gap-2">
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search by name or slug"
            className="w-48 rounded-xl border border-slate-200 px-3 py-2 text-sm transition focus:border-brand-400 focus:ring focus:ring-brand-100"
          />
          <button
            type="submit"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => communitiesQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            <TbRefresh className={clsx('text-base', communitiesQuery.isFetching && 'animate-spin')} />
            Refresh
          </button>
        </form>
      </div>

      {communitiesQuery.isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : communities.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          {submittedSearch ? 'No communities match this search.' : 'No communities found yet.'}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Community</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-4 py-3 text-left font-semibold">Members</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
                <th className="px-4 py-3 text-right font-semibold">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {communities.map((community) => (
                <tr key={community.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <HiOutlineUsers className="text-base text-brand-500" />
                      {community.name}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-500">{community.slug}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {community.memberCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {community.createdAt ? dayjs(community.createdAt).format('MMM D, YYYY') : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {(['public', 'restricted', 'private'] as const).map((visibilityOption) => (
                        <button
                          key={visibilityOption}
                          type="button"
                          onClick={() =>
                            updateVisibilityMutation.mutate({
                              communityId: community.id,
                              visibility: visibilityOption,
                            })
                          }
                          disabled={
                            updateVisibilityMutation.isPending ||
                            community.visibility === visibilityOption
                          }
                          className={clsx(
                            'rounded-xl border px-3 py-1 text-xs font-semibold transition capitalize',
                            community.visibility === visibilityOption
                              ? 'border-brand-300 bg-brand-100 text-brand-700 cursor-default'
                              : 'border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600',
                          )}
                        >
                          {visibilityOption}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
