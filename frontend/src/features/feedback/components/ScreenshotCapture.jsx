import React from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useScreenshotCapture } from '../hooks/useScreenshotCapture.js';
import styles from '../styles/feedback.module.css';

export function ScreenshotCapture({ onCapture, disabled, currentCount, maxCount = 5 }) {
  const { isCapturing, captureError, capturePage } = useScreenshotCapture();

  const handleCaptureClick = async () => {
    try {
      await capturePage(async (blob, filename) => {
        if (onCapture) {
          await onCapture(blob, filename);
        }
      });
    } catch {
      // Error is set in captureError state
    }
  };

  const isLimitReached = currentCount >= maxCount;

  return (
    <div>
      <div className={styles.captureBar}>
        <button
          type="button"
          className={styles.captureButton}
          onClick={handleCaptureClick}
          disabled={disabled || isCapturing || isLimitReached}
          title={isLimitReached ? 'Maximum attachments reached' : 'Take a screenshot of the current viewport'}
        >
          {isCapturing ? (
            <>
              <Loader2 size={16} className={styles.spinner} />
              <span>Capturing screen...</span>
            </>
          ) : (
            <>
              <Camera size={16} />
              <span>Capture Current Page</span>
            </>
          )}
        </button>
      </div>

      {captureError && (
        <div style={{ fontSize: '11.5px', color: 'var(--fb-cat-bug-accent)', marginTop: '6px' }}>
          {captureError}
        </div>
      )}
    </div>
  );
}

export default ScreenshotCapture;

