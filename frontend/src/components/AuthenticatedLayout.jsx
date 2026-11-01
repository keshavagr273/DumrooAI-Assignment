import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Navbar from './Navbar.jsx';
import FeedbackWidget from '../features/feedback/components/FeedbackWidget.jsx';

export function AuthenticatedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--fb-bg-surface)',
        color: 'var(--fb-text-secondary)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--fb-border-color)',
            borderTopColor: 'var(--fb-primary-500)',
            borderRadius: '50%',
            animation: 'spin 800ms linear infinite',
            margin: '0 auto 12px auto'
          }} />
          <div style={{ fontSize: '13px', fontWeight: 500 }}>Loading workspace...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--fb-bg-muted)' }}>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <Outlet />
      </main>

      {/* 
        CRITICAL REQUIREMENT: FeedbackWidget is mounted ONCE in the global authenticated layout 
        Available on every authenticated route and persists across navigation.
      */}
      <FeedbackWidget />
    </div>
  );
}

export default AuthenticatedLayout;

