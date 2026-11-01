import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import styles from '../styles/feedback.module.css';

export function ContextDisclosure({ context }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!context) return null;

  return (
    <div className={styles.disclosure}>
      <button
        type="button"
        className={styles.disclosureHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} style={{ color: 'var(--fb-primary-500)' }} />
          <span>Diagnostic metadata included</span>
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className={styles.disclosureBody}>
          <div className={styles.contextRow}>
            <span>Page URL</span>
            <span className={styles.contextValue} title={context.pageUrl}>
              {context.pageUrl || 'N/A'}
            </span>
          </div>
          <div className={styles.contextRow}>
            <span>Browser</span>
            <span className={styles.contextValue}>{context.browser || 'Unknown'}</span>
          </div>
          <div className={styles.contextRow}>
            <span>Operating System</span>
            <span className={styles.contextValue}>{context.os || 'Unknown'}</span>
          </div>
          <div className={styles.contextRow}>
            <span>Resolution / Viewport</span>
            <span className={styles.contextValue}>
              {context.screenResolution} ({context.viewport})
            </span>
          </div>

          <div className={styles.privacyNotice}>
            🔒 <strong>Privacy Guarantee:</strong> We only collect technical device and URL info
            to reproduce bugs. Form fields, passwords, authentication tokens, and cookies are never
            collected.
          </div>
        </div>
      )}
    </div>
  );
}

export default ContextDisclosure;

