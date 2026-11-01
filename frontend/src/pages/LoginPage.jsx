import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ShieldCheck, UserCheck, Sparkles, AlertCircle } from 'lucide-react';
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
      // Seed default users first if needed
      await seedDemoUsers().catch(() => {});
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--fb-bg-muted)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--fb-bg-surface)',
        borderRadius: '20px',
        border: '1px solid var(--fb-border-color)',
        boxShadow: 'var(--fb-shadow-xl)',
        padding: '36px 32px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '140px',
          background: 'var(--fb-aurora-glow)',
          pointerEvents: 'none',
          opacity: 0.8
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--fb-accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: 'var(--fb-shadow-md)'
            }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--fb-text-primary)' }}>
                Dumroo Support System
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--fb-text-muted)', margin: 0 }}>
                Sign in to access your authenticated workspace
              </p>
            </div>
          </div>

          {/* Quick Demo Logins Banner */}
          <div style={{
            marginTop: '20px',
            marginBottom: '24px',
            padding: '14px',
            borderRadius: '12px',
            backgroundColor: 'var(--fb-primary-50)',
            border: '1px solid var(--fb-primary-200)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fb-primary-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: 'var(--fb-primary-600)' }} />
              One-Click Demo Credentials
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('user@acme.com', 'Password123!')}
                disabled={loading}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--fb-primary-300)',
                  backgroundColor: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--fb-primary-700)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: 'var(--fb-shadow-sm)'
                }}
              >
                <UserCheck size={13} />
                Demo User
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@acme.com', 'Admin123!')}
                disabled={loading}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--fb-primary-300)',
                  backgroundColor: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--fb-primary-700)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: 'var(--fb-shadow-sm)'
                }}
              >
                <ShieldCheck size={13} />
                Demo Admin
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--fb-cat-bug-bg)',
              border: '1px solid var(--fb-cat-bug-border)',
              color: 'var(--fb-cat-bug-accent)',
              fontSize: '12px',
              marginBottom: '16px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--fb-text-primary)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--fb-border-color)',
                      backgroundColor: 'var(--fb-bg-surface)',
                      color: 'var(--fb-text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--fb-text-primary)' }}>
                    Organization Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--fb-border-color)',
                      backgroundColor: 'var(--fb-bg-surface)',
                      color: 'var(--fb-text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--fb-text-primary)' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--fb-border-color)',
                  backgroundColor: 'var(--fb-bg-surface)',
                  color: 'var(--fb-text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--fb-text-primary)' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--fb-border-color)',
                  backgroundColor: 'var(--fb-bg-surface)',
                  color: 'var(--fb-text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--fb-button-gradient)',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--fb-shadow-md)',
                transition: 'all 150ms'
              }}
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--fb-primary-600)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

