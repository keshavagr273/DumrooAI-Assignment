import React, { useState } from 'react';
import { Check, Copy, CheckCheck } from 'lucide-react';
import styles from '../styles/feedback.module.css';

export function FeedbackSuccess({ report, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyReference = () => {
    if (report?.referenceId) {
      navigator.clipboard.writeText(report.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.successContainer}>
      <div className={styles.successBadgeWrapper}>
        <Check size={36} strokeWidth={2.5} />
      </div>

      <h3 className={styles.successTitle}>Thank You for Your Feedback!</h3>

      <p className={styles.successText}>
        We have received your report and our engineering and design team will review it. You can
        track updates anytime in your reports tab.
      </p>

      {report?.referenceId && (
        <div className={styles.referenceBox}>
          <div>
            <div className={styles.refLabel}>Reference ID</div>
            <div className={styles.refValue}>{report.referenceId}</div>
          </div>
          <button
            type="button"
            className={styles.copyRefButton}
            onClick={handleCopyReference}
            title="Copy Reference ID"
            aria-label="Copy Reference ID"
          >
            {copied ? <CheckCheck size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
          </button>
        </div>
      )}

      <button
        type="button"
        className={styles.submitButton}
        style={{ marginTop: '16px', maxWidth: '240px' }}
        onClick={onClose}
      >
        Done
      </button>
    </div>
  );
}

export default FeedbackSuccess;

