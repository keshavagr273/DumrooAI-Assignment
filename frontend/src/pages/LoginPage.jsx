import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ShieldCheck, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { seedDemoUsers } from '../services/api.js';

export function LoginPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({ email, password, name, organizationName: orgName });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setError(null);
    setLoading(true);
    try {
      // Non-blocking seed attempt
      seedDemoUsers().catch(() => {});
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--fb-bg-muted)',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--fb-bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--fb-border-color)',
          boxShadow: 'var(--fb-shadow-lg)',
          padding: '32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--fb-text-primary)',
              color: 'var(--fb-bg-surface)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}
          >
            <MessageSquare size={22} strokeWidth={2.2} />
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
            Dumroo <span style={{ color: 'var(--fb-primary-500)' }}>Feedback</span>
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--fb-text-secondary)',
              margin: 0,
            }}
          >
            {isRegister
              ? 'Create your account to get started'
              : 'Sign in to access your workspace'}
          </p>
        </div>

        {/* Demo Fast-Login Section */}
        {!isRegister && (
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: 'var(--fb-bg-subtle)',
              borderRadius: '12px',
              border: '1px solid var(--fb-border-color)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--fb-text-muted)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Instant Demo Access</span>
              <span style={{ fontSize: '10px', color: 'var(--fb-primary-500)' }}>Ready</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('user@acme.com', 'Password123!')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: 'var(--fb-bg-surface)',
                  border: '1px solid var(--fb-border-color)',
                  borderRadius: '8px',
                  color: 'var(--fb-text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--fb-primary-400)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--fb-border-color)';
                }}
              >
                <UserCheck size={14} color="var(--fb-text-muted)" />
                Demo User
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@acme.com', 'Admin123!')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: 'var(--fb-bg-surface)',
                  border: '1px solid var(--fb-border-color)',
                  borderRadius: '8px',
                  color: 'var(--fb-text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--fb-primary-400)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--fb-border-color)';
                }}
              >
                <ShieldCheck size={14} color="var(--fb-primary-500)" />
                Demo Admin
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: 'var(--fb-cat-bug-bg)',
              border: '1px solid var(--fb-cat-bug-border)',
              borderRadius: '8px',
              color: 'var(--fb-cat-bug-accent)',
              fontSize: '12.5px',
              lineHeight: 1.4,
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <>
              <div>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    color: 'var(--fb-text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--fb-bg-subtle)',
                    border: '1px solid var(--fb-border-color)',
                    borderRadius: '8px',
                    color: 'var(--fb-text-primary)',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--fb-primary-500)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--fb-border-color)')}
                />
              </div>

              <div>
                <label
                  htmlFor="org"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    color: 'var(--fb-text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Organization (Optional)
                </label>
                <input
                  id="org"
                  type="text"
                  placeholder="Acme Global Inc"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--fb-bg-subtle)',
                    border: '1px solid var(--fb-border-color)',
                    borderRadius: '8px',
                    color: 'var(--fb-text-primary)',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--fb-primary-500)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--fb-border-color)')}
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 500,
                color: 'var(--fb-text-secondary)',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--fb-bg-subtle)',
                border: '1px solid var(--fb-border-color)',
                borderRadius: '8px',
                color: 'var(--fb-text-primary)',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 150ms ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--fb-primary-500)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--fb-border-color)')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 500,
                color: 'var(--fb-text-secondary)',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--fb-bg-subtle)',
                border: '1px solid var(--fb-border-color)',
                borderRadius: '8px',
                color: 'var(--fb-text-primary)',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 150ms ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--fb-primary-500)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--fb-border-color)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '11px',
              marginTop: '4px',
              backgroundColor: 'var(--fb-primary-500)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 150ms ease, opacity 150ms ease',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--fb-primary-600)';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--fb-primary-500)';
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fb-text-secondary)',
              fontSize: '12.5px',
              cursor: 'pointer',
              padding: '4px',
              textDecoration: 'none',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fb-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fb-text-secondary)')}
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
