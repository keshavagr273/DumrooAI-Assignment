import React, { useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { useFeedback } from '../hooks/useFeedback.js';
import FeedbackModal from './FeedbackModal.jsx';
import styles from '../styles/feedback.module.css';

export function FeedbackWidget() {
  const [showTooltip, setShowTooltip] = useState(false);
  const feedback = useFeedback();

  return (
    <>
      <div className={styles.triggerWrapper} data-feedback-ui="true">
        {showTooltip && !feedback.isOpen && (
          <div className={styles.tooltip} role="tooltip">
            Help & Feedback
          </div>
        )}

        <button
          type="button"
          className={styles.triggerButton}
          onClick={() => feedback.openFeedback()}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          aria-label="Open support and feedback dialog"
        >
          <span className={styles.triggerIcon}>
            <LifeBuoy size={18} strokeWidth={2.2} />
          </span>
          <span className={styles.triggerLabel}>Feedback</span>
        </button>
      </div>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={feedback.closeFeedback}
        category={feedback.category}
        onSelectCategory={feedback.setCategory}
        description={feedback.description}
        onChangeDescription={feedback.setDescription}
        attachments={feedback.attachments}
        onAddAttachment={feedback.addAttachment}
        onRemoveAttachment={feedback.removeAttachment}
        context={feedback.context}
        isSubmitting={feedback.isSubmitting}
        submitError={feedback.submitError}
        submittedReport={feedback.submittedReport}
        onSubmit={feedback.submitFeedback}
      />
    </>
  );
}

export default FeedbackWidget;
