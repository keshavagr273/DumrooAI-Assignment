import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, History, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid var(--fb-border-color)',
      backgroundColor: 'var(--fb-bg-surface-glass)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--fb-text-primary)' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'var(--fb-accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--fb-shadow-sm)'
          }}>
            <MessageSquare size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>
            Dumroo<span style={{ color: 'var(--fb-primary-500)' }}>Feedback</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              color: location.pathname === '/' ? 'var(--fb-primary-600)' : 'var(--fb-text-secondary)',
              backgroundColor: location.pathname === '/' ? 'var(--fb-primary-50)' : 'transparent',
              transition: 'all 150ms'
            }}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>

          <Link
            to="/reports"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              color: location.pathname === '/reports' ? 'var(--fb-primary-600)' : 'var(--fb-text-secondary)',
              backgroundColor: location.pathname === '/reports' ? 'var(--fb-primary-50)' : 'transparent',
              transition: 'all 150ms'
            }}
          >
            <History size={15} />
            My Reports
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            background: 'var(--fb-bg-muted)',
            border: '1px solid var(--fb-border-color)',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--fb-text-secondary)',
            cursor: 'pointer',
          }}
          title="Toggle color theme"
        >
          <Sun size={15} className="light-icon" />
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fb-text-primary)' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--fb-text-muted)' }}>
                {user.role === 'admin' ? '🛡️ Administrator' : 'User'}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid var(--fb-border-color)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--fb-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Sign out"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;

