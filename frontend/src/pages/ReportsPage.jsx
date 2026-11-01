import React, { useState, useEffect } from 'react';
import {
  Filter,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { fetchMyReports, updateFeedbackStatus } from '../features/feedback/services/feedbackApi.js';
import { useAuth } from '../hooks/useAuth.jsx';

const STATUS_OPTIONS = ['open', 'under_review', 'in_progress', 'resolved', 'closed'];

export function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = user?.role === 'admin';

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyReports({
        page,
        limit: 10,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      setReports(data.data?.items || []);
      setTotal(data.data?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load feedback reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [page, categoryFilter, statusFilter]);

  const handleStatusChange = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      await updateFeedbackStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => ((r._id === reportId || r.feedbackId === reportId) ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'open').toLowerCase();
    let bg = 'var(--fb-bg-subtle)';
    let color = 'var(--fb-text-secondary)';

    if (s === 'open') {
      bg = 'var(--fb-cat-ui-bg)';
      color = 'var(--fb-cat-ui-accent)';
    } else if (s === 'in_progress' || s === 'under_review') {
      bg = 'var(--fb-cat-general-bg)';
      color = 'var(--fb-cat-general-accent)';
    } else if (s === 'resolved') {
      bg = 'var(--fb-cat-feature-bg)';
      color = 'var(--fb-cat-feature-accent)';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: '4px',
          backgroundColor: bg,
          color: color,
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {s.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--fb-text-primary)' }}>
            Feedback & Issue Reports
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--fb-text-secondary)', margin: 0 }}>
            {isAdmin ? 'Admin View: Triaging reports across all users' : 'Track and manage your submitted issue reports'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            backgroundColor: 'var(--fb-bg-surface)',
            border: '1px solid var(--fb-border-color)',
            borderRadius: '6px',
            color: 'var(--fb-text-primary)',
            fontSize: '12.5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: 'var(--fb-bg-surface)',
          border: '1px solid var(--fb-border-color)',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--fb-text-muted)', marginRight: '4px' }}>
          Filters:
        </span>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--fb-border-color)',
            backgroundColor: 'var(--fb-bg-subtle)',
            color: 'var(--fb-text-primary)',
            fontSize: '12px',
            outline: 'none',
          }}
        >
          <option value="">All Categories</option>
          <option value="bug">Bug Report</option>
          <option value="ui_ux">UI / UX Issue</option>
          <option value="feature_request">Feature Request</option>
          <option value="general">General Feedback</option>
          <option value="other">Other</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--fb-border-color)',
            backgroundColor: 'var(--fb-bg-subtle)',
            color: 'var(--fb-text-primary)',
            fontSize: '12px',
            outline: 'none',
          }}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        {(categoryFilter || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('');
              setStatusFilter('');
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--fb-primary-500)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--fb-text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '13px' }}>Loading reports...</div>
        </div>
      ) : reports.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--fb-bg-surface)',
            border: '1px solid var(--fb-border-color)',
            borderRadius: '10px',
          }}
        >
          <CheckCircle size={32} color="var(--fb-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--fb-text-primary)', margin: '0 0 6px 0' }}>
            No Feedback Reports Found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--fb-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            {categoryFilter || statusFilter
              ? 'No reports match your active filter criteria.'
              : 'You have not submitted any issue reports yet. Use the floating Feedback button at the bottom-right to submit one!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reports.map((report) => {
            const reportId = report._id || report.feedbackId;
            return (
              <div
                key={reportId}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--fb-bg-surface)',
                  border: '1px solid var(--fb-border-color)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--fb-text-primary)' }}>
                      {report.referenceId}
                    </span>
                    {getStatusBadge(report.status)}
                    <span style={{ fontSize: '11px', color: 'var(--fb-text-muted)', textTransform: 'capitalize' }}>
                      • {report.category?.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--fb-text-muted)' }}>
                      • {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--fb-text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    {report.description}
                  </p>

                  {/* Context info */}
                  {report.context && (
                    <div style={{ fontSize: '11px', color: 'var(--fb-text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {report.context.pageUrl && <span>URL: {report.context.pageUrl}</span>}
                      {report.context.browser && <span>Browser: {report.context.browser}</span>}
                      {report.context.os && <span>OS: {report.context.os}</span>}
                    </div>
                  )}

                  {/* Attachment links */}
                  {report.attachments && report.attachments.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {report.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.signedUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '11.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--fb-primary-500)',
                            textDecoration: 'none',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--fb-bg-subtle)',
                            border: '1px solid var(--fb-border-color)',
                          }}
                        >
                          <ExternalLink size={11} />
                          <span>Screenshot {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Status Triage */}
                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--fb-text-muted)' }}>Triage:</span>
                    <select
                      value={report.status || 'open'}
                      disabled={updatingId === reportId}
                      onChange={(e) => handleStatusChange(reportId, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--fb-border-color)',
                        backgroundColor: 'var(--fb-bg-subtle)',
                        color: 'var(--fb-text-primary)',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                      }}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
