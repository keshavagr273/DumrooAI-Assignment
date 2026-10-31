import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { useFeedbackUpload } from '../hooks/useFeedbackUpload.js';
import { FEEDBACK_CONFIG } from '../utils/constants.js';
import styles from '../styles/feedback.module.css';

export function AttachmentUploader({ onAddAttachment, currentCount }) {
  const fileInputRef = useRef(null);
  const {
    isDragging,
    uploadError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
  } = useFeedbackUpload(onAddAttachment, currentCount);

  const isLimitReached = currentCount >= FEEDBACK_CONFIG.maxAttachments;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        disabled={isLimitReached}
      />

      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLimitReached && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload screenshot or image attachments"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !isLimitReached && fileInputRef.current?.click();
          }
        }}
      >
        <UploadCloud size={20} style={{ color: 'var(--fb-primary-500)', margin: '0 auto' }} />
        <div className={styles.dropzoneText}>
          {isLimitReached ? (
            <span>Maximum 5 attachments reached</span>
          ) : (
            <span>
              <strong>Click to upload</strong> or drag & drop images
            </span>
          )}
        </div>
        <div className={styles.dropzoneSubtext}>
          PNG, JPEG or WebP up to 5 MB ({currentCount}/{FEEDBACK_CONFIG.maxAttachments})
        </div>
      </div>

      {uploadError && (
        <div style={{ fontSize: '11.5px', color: 'var(--fb-cat-bug-accent)', marginTop: '6px' }}>
          {uploadError}
        </div>
      )}
    </div>
  );
}

export default AttachmentUploader;
