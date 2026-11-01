import React, { useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import CategorySelector from './CategorySelector.jsx';
import DescriptionField from './DescriptionField.jsx';
import ScreenshotCapture from './ScreenshotCapture.jsx';
import ScreenshotPreview from './ScreenshotPreview.jsx';
import AttachmentUploader from './AttachmentUploader.jsx';
import ContextDisclosure from './ContextDisclosure.jsx';
import FeedbackSuccess from './FeedbackSuccess.jsx';
import FeedbackError from './FeedbackError.jsx';
import { FEEDBACK_CONFIG } from '../utils/constants.js';
import styles from '../styles/feedback.module.css';

export function FeedbackModal({
  isOpen,
  onClose,
  category,
  onSelectCategory,
  description,
  onChangeDescription,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  context,
  isSubmitting,
  submitError,
  submittedReport,
  onSubmit,
}) {
  const drawerRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDescriptionValid =
    (description || '').trim().length >= FEEDBACK_CONFIG.descriptionMinLength;
  const isSubmitDisabled = isSubmitting || !isDescriptionValid;

  return (
    <div data-feedback-ui="true">
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Drawer Dialog */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        className={styles.drawer}
      >
        {/* Mobile handle indicator */}
        <div className={styles.mobileHandle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.auroraGlow} />
          <div className={styles.headerContent}>
            <div className={styles.titleArea}>
              <h2 id="feedback-dialog-title" className={styles.title}>
                Send In-App Feedback
              </h2>
              <p className={styles.subtitle}>
                Help us improve by sharing bugs, ideas, or impressions
              </p>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close feedback dialog"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {submittedReport ? (
          <FeedbackSuccess report={submittedReport} onClose={onClose} />
        ) : (
          <>
            <div className={styles.body}>
              {/* Category */}
              <CategorySelector
                selectedCategory={category}
                onSelectCategory={onSelectCategory}
              />

              {/* Description */}
              <DescriptionField
                value={description}
                onChange={onChangeDescription}
                error={Boolean(submitError && !isDescriptionValid)}
              />

              {/* Screenshots & Attachments */}
              <div className={styles.attachmentArea}>
                <div className={styles.sectionLabel}>
                  <span>Screenshots & Attachments</span>
                  <span style={{ fontSize: '11px', color: 'var(--fb-text-muted)', fontWeight: 400 }}>
                    {attachments.length} of {FEEDBACK_CONFIG.maxAttachments} attached
                  </span>
                </div>

                <ScreenshotCapture
                  onCapture={onAddAttachment}
                  disabled={isSubmitting}
                  currentCount={attachments.length}
                  maxCount={FEEDBACK_CONFIG.maxAttachments}
                />

                <AttachmentUploader
                  onAddAttachment={onAddAttachment}
                  currentCount={attachments.length}
                />

                <ScreenshotPreview
                  attachments={attachments}
                  onRemove={onRemoveAttachment}
                />
              </div>

              {/* Privacy Disclosure & Diagnostic Metadata */}
              <ContextDisclosure context={context} />

              {/* Error banner if submission failed */}
              {submitError && (
                <FeedbackError message={submitError} onRetry={onSubmit} />
              )}
            </div>

            {/* Footer / Submit CTA */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.submitButton}
                onClick={onSubmit}
                disabled={isSubmitDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    <span>Submitting feedback...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;

