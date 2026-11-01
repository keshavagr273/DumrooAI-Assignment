import React from 'react';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Server,
  Activity,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

export function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Active Users', value: '2,845', change: '+12.4%', icon: Users, color: '#6366f1' },
    { label: 'System Uptime', value: '99.98%', change: '+0.02%', icon: Server, color: '#10b981' },
    { label: 'Pending Tickets', value: '14', change: '-3.1%', icon: AlertTriangle, color: '#f59e0b' },
    { label: 'Resolution Rate', value: '94.2%', change: '+5.7%', icon: CheckCircle2, color: '#8b5cf6' },
  ];

  const recentEvents = [
    { id: 1, type: 'Billing sync completed', service: 'Stripe Gateway', time: '12m ago', status: 'Success' },
    { id: 2, type: 'Database snapshot created', service: 'MongoDB Atlas', time: '45m ago', status: 'Success' },
    { id: 3, type: 'High latency detected', service: 'API Cluster 2', time: '2h ago', status: 'Warning' },
    { id: 4, type: 'New client onboarding', service: 'Acme Workspace', time: '5h ago', status: 'Success' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div style={{
        padding: '28px',
        borderRadius: '16px',
        background: 'var(--fb-bg-surface)',
        border: '1px solid var(--fb-border-color)',
        boxShadow: 'var(--fb-shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '100%',
          background: 'var(--fb-aurora-glow)',
          opacity: 0.6,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: 'var(--fb-text-primary)' }}>
            Welcome back, {user?.name || 'Workspace User'} 👋
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--fb-text-secondary)', margin: 0 }}>
            Here is what is happening across your systems today. Notice any issue? Click the floating{' '}
            <strong style={{ color: 'var(--fb-primary-600)' }}>Feedback</strong> button at the bottom-right to capture and report it!
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              style={{
                padding: '20px',
                borderRadius: '14px',
                backgroundColor: 'var(--fb-bg-surface)',
                border: '1px solid var(--fb-border-color)',
                boxShadow: 'var(--fb-shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--fb-text-muted)' }}>
                  {stat.label}
                </span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: `${stat.color}15`,
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fb-text-primary)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUpRight size={13} />
                <span>{stat.change} vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Recent Events Table */}
        <div style={{
          padding: '22px',
          borderRadius: '16px',
          backgroundColor: 'var(--fb-bg-surface)',
          border: '1px solid var(--fb-border-color)',
          boxShadow: 'var(--fb-shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--fb-text-primary)' }}>
              Recent System Activity
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--fb-text-muted)' }}>Realtime audit logs</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--fb-bg-muted)',
                  border: '1px solid var(--fb-border-color)'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fb-text-primary)' }}>
                    {evt.type}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--fb-text-muted)', marginTop: '2px' }}>
                    {evt.service} • {evt.time}
                  </div>
                </div>

                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: evt.status === 'Success' ? '#ecfdf5' : '#fffbeb',
                  color: evt.status === 'Success' ? '#059669' : '#d97706',
                  border: evt.status === 'Success' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                }}>
                  {evt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Support & Feedback Card */}
        <div style={{
          padding: '22px',
          borderRadius: '16px',
          backgroundColor: 'var(--fb-bg-surface)',
          border: '1px solid var(--fb-border-color)',
          boxShadow: 'var(--fb-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--fb-text-primary)' }}>
            Need Help or Found a Bug?
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--fb-text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Our support desk is directly integrated into this app. When you encounter a glitch:
          </p>

          <ul style={{ fontSize: '12px', color: 'var(--fb-text-secondary)', paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Click <strong>Feedback</strong> floating in the corner</li>
            <li>Use <strong>Capture Current Page</strong> to snap this screen</li>
            <li>Attach additional screenshots (up to 5)</li>
            <li>Submit directly to our product engineering Teams channel</li>
          </ul>

          <div style={{
            marginTop: 'auto',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: 'var(--fb-primary-50)',
            border: '1px solid var(--fb-primary-200)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            color: 'var(--fb-primary-800)',
            fontWeight: 500
          }}>
            <Activity size={16} style={{ color: 'var(--fb-primary-600)', flexShrink: 0 }} />
            <span>Automatic Teams webhook notification on submit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

