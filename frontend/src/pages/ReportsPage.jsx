import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { fetchMyReports, updateFeedbackStatus } from '../features/feedback/services/feedbackApi.js';
import { useAuth } from '../hooks/useAuth.jsx';

const STATUS_COLORS = {
  open: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
  under_review: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  in_progress: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
  resolved: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  closed: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
};

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
        prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: 'var(--fb-text-primary)' }}>
            Feedback & Support History
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--fb-text-secondary)', margin: 0 }}>
            Track and monitor issues reported by your team and organization
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--fb-border-color)',
            backgroundColor: 'var(--fb-bg-surface)',
            color: 'var(--fb-text-primary)',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: '12px',
        backgroundColor: 'var(--fb-bg-surface)',
        border: '1px solid var(--fb-border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--fb-text-secondary)' }}>
          <Filter size={14} />
          Filters:
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--fb-border-color)',
            backgroundColor: 'var(--fb-bg-muted)',
            color: 'var(--fb-text-primary)',
            fontSize: '12px'
          }}
        >
          <option value="">All Categories</option>
          <option value="bug">Bug Report</option>
          <option value="ui_ux">UI / UX Issue</option>
          <option value="feature_request">Feature Request</option>
          <option value="general">General</option>
          <option value="other">Other</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--fb-border-color)',
            backgroundColor: 'var(--fb-bg-muted)',
            color: 'var(--fb-text-primary)',
            fontSize: '12px'
          }}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--fb-text-muted)' }}>
          {total} report{total !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--fb-text-muted)' }}>
          <Loader2 size={32} className="spinner" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading feedback reports...</div>
        </div>
      ) : error ? (
        <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: 'var(--fb-cat-bug-bg)', color: 'var(--fb-cat-bug-accent)' }}>
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          backgroundColor: 'var(--fb-bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--fb-border-color)',
          color: 'var(--fb-text-muted)'
        }}>
          <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fb-text-primary)', margin: '0 0 6px 0' }}>
            No Feedback Reports Yet
          </h3>
          <p style={{ fontSize: '13px', margin: 0 }}>
            Click the floating Feedback button on the bottom-right to submit your first report!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reports.map((report) => {
            const statusStyle = STATUS_COLORS[report.status] || STATUS_COLORS.open;

            return (
              <div
                key={report._id}
                style={{
                  padding: '20px 24px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--fb-bg-surface)',
                  border: '1px solid var(--fb-border-color)',
                  boxShadow: 'var(--fb-shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13.5px', color: 'var(--fb-primary-600)' }}>
                      {report.referenceId}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--fb-bg-muted)',
                      border: '1px solid var(--fb-border-color)',
                      textTransform: 'uppercase',
                      color: 'var(--fb-text-secondary)'
                    }}>
                      {report.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Admin Status Dropdown */}
                    {user?.role === 'admin' ? (
                      <select
                        value={report.status}
                        disabled={updatingId === report._id}
                        onChange={(e) => handleStatusChange(report._id, e.target.value)}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="open">OPEN</option>
                        <option value="under_review">UNDER REVIEW</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="resolved">RESOLVED</option>
                        <option value="closed">CLOSED</option>
                      </select>
                    ) : (
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                        textTransform: 'uppercase'
                      }}>
                        {report.status.replace('_', ' ')}
                      </span>
                    )}

                    <span style={{ fontSize: '11.5px', color: 'var(--fb-text-muted)' }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p style={{
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  color: 'var(--fb-text-primary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {report.description}
                </p>

                {/* Screenshots Gallery */}
                {report.attachments && report.attachments.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--fb-text-muted)', marginBottom: '8px' }}>
                      Attachments ({report.attachments.length}):
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {report.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.signedDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--fb-bg-muted)',
                            border: '1px solid var(--fb-border-color)',
                            fontSize: '12px',
                            color: 'var(--fb-primary-600)',
                            textDecoration: 'none'
                          }}
                        >
                          <ExternalLink size={13} />
                          <span>{att.originalFilename || `Screenshot ${idx + 1}`}</span>
                        </a>
                      ))}
                    </div>
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
