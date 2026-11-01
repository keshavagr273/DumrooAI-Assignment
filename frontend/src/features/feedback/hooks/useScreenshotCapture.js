import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

export function useScreenshotCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(null);

  /**
   * Captures the visible viewport / document using html2canvas.
   * Only called on explicit user button click.
   */
  const capturePage = useCallback(async (onCaptured) => {
    setIsCapturing(true);
    setCaptureError(null);

    try {
      // Find feedback overlay elements and temporarily hide them from capture
      const feedbackWidgets = document.querySelectorAll('[data-feedback-ui="true"]');
      feedbackWidgets.forEach((el) => {
        el.style.visibility = 'hidden';
      });

      // Brief pause to allow paint cycle
      await new Promise((resolve) => setTimeout(resolve, 60));

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        scale: Math.min(window.devicePixelRatio || 1, 2), // Cap devicePixelRatio to 2 to avoid gigantic canvases
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        ignoreElements: (element) => {
          return (
            element.getAttribute('data-feedback-ui') === 'true' ||
            element.classList.contains('feedback-ignore-capture')
          );
        },
      });

      // Restore feedback overlay elements
      feedbackWidgets.forEach((el) => {
        el.style.visibility = '';
      });

      // Convert canvas to Blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas to Blob conversion failed'));
          },
          'image/png',
          0.92
        );
      });

      const filename = `page-capture-${Date.now()}.png`;
      if (onCaptured) {
        await onCaptured(blob, filename);
      }

      return { blob, filename };
    } catch (err) {
      console.error('[useScreenshotCapture] Error capturing page:', err);
      // Restore elements if error occurred
      const feedbackWidgets = document.querySelectorAll('[data-feedback-ui="true"]');
      feedbackWidgets.forEach((el) => {
        el.style.visibility = '';
      });

      const msg = 'Unable to capture page screenshot. Please upload an image manually.';
      setCaptureError(msg);
      throw new Error(msg);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return {
    isCapturing,
    captureError,
    capturePage,
  };
}

export default useScreenshotCapture;

