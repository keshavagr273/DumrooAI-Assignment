import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import styles from '../styles/feedback.module.css';

export function FeedbackError({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className={styles.errorBanner}>
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>Submission issue</div>
        <div style={{ marginTop: '2px', opacity: 0.9 }}>{message}</div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              marginTop: '6px',
              color: 'inherit',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
            }}
          >
            <RotateCcw size={12} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export default FeedbackError;
