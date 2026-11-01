import React from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import styles from '../styles/feedback.module.css';

export function ScreenshotPreview({ attachments, onRemove }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={styles.previewGrid}>
      {attachments.map((att) => (
        <div key={att.id} className={styles.thumbnailCard}>
          <img
            src={att.previewUrl}
            alt={att.filename || 'Screenshot preview'}
            className={styles.thumbnailImg}
          />

          <button
            type="button"
            className={styles.thumbnailRemove}
            onClick={() => onRemove(att.id)}
            title="Remove attachment"
            aria-label={`Remove ${att.filename}`}
          >
            <X size={12} />
          </button>

          {att.uploadStatus === 'uploading' && (
            <div className={styles.uploadBadge}>
              <Loader2 size={10} className={styles.spinner} />
            </div>
          )}

          {att.uploadStatus === 'uploaded' && (
            <div className={styles.uploadBadge} style={{ background: '#10b981' }}>
              <CheckCircle size={10} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ScreenshotPreview;

