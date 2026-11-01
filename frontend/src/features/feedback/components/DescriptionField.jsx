import React from 'react';
import { FEEDBACK_CONFIG } from '../utils/constants.js';
import styles from '../styles/feedback.module.css';

export function DescriptionField({ value, onChange, error }) {
  const charCount = (value || '').length;
  const minLength = FEEDBACK_CONFIG.descriptionMinLength;
  const maxLength = FEEDBACK_CONFIG.descriptionMaxLength;
  const isTooShort = charCount > 0 && charCount < minLength;
  const progressPercent = Math.min((charCount / maxLength) * 100, 100);

  // SVG circle calculation
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={styles.descriptionWrapper}>
      <label htmlFor="feedback-description" className={styles.sectionLabel}>
        <span>Description</span>
        <span className={styles.charCounter}>
          <svg className={styles.charCounterRing} viewBox="0 0 16 16">
            <circle
              cx="8"
              cy="8"
              r={radius}
              fill="none"
              stroke="var(--fb-border-color)"
              strokeWidth="2"
            />
            <circle
              cx="8"
              cy="8"
              r={radius}
              fill="none"
              stroke={isTooShort ? 'var(--fb-cat-bug-accent)' : 'var(--fb-primary-500)'}
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {charCount} / {maxLength}
        </span>
      </label>

      <textarea
        id="feedback-description"
        className={`${styles.textarea} ${error || isTooShort ? styles.textareaError : ''}`}
        placeholder="Tell us what happened, what you expected, or what we could improve..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={4}
        aria-describedby="description-hint"
      />

      <div className={styles.descriptionMeta} id="description-hint">
        {isTooShort ? (
          <span style={{ color: 'var(--fb-cat-bug-accent)' }}>
            Please write at least {minLength - charCount} more character{minLength - charCount > 1 ? 's' : ''}.
          </span>
        ) : (
          <span>Line breaks are preserved. Be as specific as possible.</span>
        )}
      </div>
    </div>
  );
}

export default DescriptionField;

