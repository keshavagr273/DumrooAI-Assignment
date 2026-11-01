import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Server,
  LifeBuoy,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { triggerOpenFeedback } from '../features/feedback/hooks/useFeedback.js';

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const stats = [
    { label: 'Active Sessions', value: '1,420', change: '+8.2%', icon: Users },
    { label: 'System Uptime', value: '99.98%', change: '+0.01%', icon: Server },
    { label: 'Pending Issues', value: '3', change: '-40%', icon: AlertTriangle },
    { label: 'Resolution Rate', value: '96.4%', change: '+2.1%', icon: CheckCircle2 },
  ];

  const systemStatus = [
    { name: 'API Gateway (Express)', status: 'Operational', latency: '42ms' },
    { name: 'Database (MongoDB Atlas)', status: 'Connected', latency: '28ms' },
    { name: 'Screenshot Storage (Supabase)', status: 'Ready', latency: '65ms' },
    { name: 'Transactional Outbox Worker', status: 'Active (5s poll)', latency: '0ms' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'inherit' }}>
      {/* Welcome / Support Banner */}
      <div
        style={{
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: 'var(--fb-bg-surface)',
          border: '1px solid var(--fb-border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--fb-primary-500)',
              marginBottom: '6px',
            }}
          >
            {isAdmin ? 'Admin Operations' : 'Workspace Overview'}
          </div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--fb-text-primary)',
              margin: '0 0 6px 0',
            }}
          >
            {isAdmin ? 'System Triage & Feedback Oversight' : `Welcome, ${user?.name || 'Workspace Member'}`}
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--fb-text-secondary)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {isAdmin
              ? 'You have full administrator access. Directly inspect, filter, triage, and update the status of all user feedback, attachments, and automated webhook dispatches.'
              : 'You are logged into your workspace. If you hit any bug, UI friction, or have an idea, click the floating Feedback button or use the quick action below to capture a screenshot and report it.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin ? (
            <>
              <Link
                to="/reports"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: 'var(--fb-text-primary)',
                  color: 'var(--fb-bg-surface)',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'opacity 150ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <ShieldCheck size={16} />
                <span>Triage All Reports</span>
                <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => triggerOpenFeedback('bug')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--fb-bg-surface)',
                  color: 'var(--fb-text-primary)',
                  border: '1px solid var(--fb-border-color)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <LifeBuoy size={15} />
                <span>Test Feedback Modal</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => triggerOpenFeedback('bug')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'var(--fb-text-primary)',
                color: 'var(--fb-bg-surface)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity 150ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <LifeBuoy size={16} />
              <span>Report an Issue</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              style={{
                padding: '18px',
                borderRadius: '10px',
                backgroundColor: 'var(--fb-bg-surface)',
                border: '1px solid var(--fb-border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--fb-text-muted)' }}>
                  {stat.label}
                </span>
                <Icon size={15} color="var(--fb-text-muted)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 600, color: 'var(--fb-text-primary)', letterSpacing: '-0.02em' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--fb-cat-feature-accent)', fontWeight: 500 }}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Infrastructure Telemetry Grid */}
      <div
        style={{
          borderRadius: '12px',
          backgroundColor: 'var(--fb-bg-surface)',
          border: '1px solid var(--fb-border-color)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 2px 0', color: 'var(--fb-text-primary)' }}>
              Connected Services & Infrastructure
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--fb-text-muted)', margin: 0 }}>
              Live telemetry and architectural components powering Dumroo Feedback
            </p>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--fb-cat-feature-bg)',
              color: 'var(--fb-cat-feature-accent)',
              border: '1px solid var(--fb-cat-feature-border)',
              fontWeight: 500,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
            All Systems Healthy
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {systemStatus.map((service, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--fb-bg-subtle)',
                border: '1px solid var(--fb-border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--fb-text-primary)' }}>
                  {service.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--fb-cat-feature-accent)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Zap size={11} />
                  <span>{service.status}</span>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--fb-text-muted)' }}>
                {service.latency}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
