export { FeedbackWidget } from './components/FeedbackWidget.jsx';
export { FeedbackModal } from './components/FeedbackModal.jsx';
export { useFeedback } from './hooks/useFeedback.js';
export { useScreenshotCapture } from './hooks/useScreenshotCapture.js';
export { useFeedbackUpload } from './hooks/useFeedbackUpload.js';
export { collectContext } from './utils/collectContext.js';
export { compressImage } from './utils/compressImage.js';
export { FEEDBACK_CATEGORIES, FEEDBACK_CONFIG } from './utils/constants.js';
export * from './services/feedbackApi.js';
export default FeedbackWidget;

