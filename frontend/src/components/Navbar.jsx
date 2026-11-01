import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, History, LogOut, Sun, Moon, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dumroo_theme', next);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header
      style={{
        height: '56px',
        borderBottom: '1px solid var(--fb-border-color)',
        backgroundColor: 'var(--fb-bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Brand & Left Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'var(--fb-text-primary)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'var(--fb-text-primary)',
              color: 'var(--fb-bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={16} strokeWidth={2.2} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '14.5px', letterSpacing: '-0.02em' }}>
            Dumroo <span style={{ color: 'var(--fb-primary-500)' }}>Feedback</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              color: location.pathname === '/' ? 'var(--fb-text-primary)' : 'var(--fb-text-secondary)',
              backgroundColor: location.pathname === '/' ? 'var(--fb-bg-subtle)' : 'transparent',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>

          <Link
            to="/reports"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              color: location.pathname === '/reports' ? 'var(--fb-text-primary)' : 'var(--fb-text-secondary)',
              backgroundColor: location.pathname === '/reports' ? 'var(--fb-bg-subtle)' : 'transparent',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            <History size={14} />
            {isAdmin ? 'All Reports' : 'My Reports'}
          </Link>
        </nav>
      </div>

      {/* Right User Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* User Info / Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--fb-text-secondary)',
              maxWidth: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name || user?.email}
          </span>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: '4px',
              border: '1px solid var(--fb-border-color)',
              backgroundColor: isAdmin ? 'var(--fb-cat-ui-bg)' : 'var(--fb-bg-subtle)',
              color: isAdmin ? 'var(--fb-cat-ui-accent)' : 'var(--fb-text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            {isAdmin && <Shield size={10} />}
            {isAdmin ? 'Admin' : 'User'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: 'transparent',
            border: '1px solid var(--fb-border-color)',
            borderRadius: '6px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--fb-text-secondary)',
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--fb-text-secondary)';
            e.currentTarget.style.color = 'var(--fb-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--fb-border-color)';
            e.currentTarget.style.color = 'var(--fb-text-secondary)';
          }}
        >
          <Sun size={14} className="sun-icon" />
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={logout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid var(--fb-border-color)',
            backgroundColor: 'transparent',
            color: 'var(--fb-text-secondary)',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--fb-cat-bug-border)';
            e.currentTarget.style.color = 'var(--fb-cat-bug-accent)';
            e.currentTarget.style.backgroundColor = 'var(--fb-cat-bug-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--fb-border-color)';
            e.currentTarget.style.color = 'var(--fb-text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={13} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
