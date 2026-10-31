import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { collectContext } from '../utils/collectContext.js';
import {
  requestUploadUrl,
  uploadFileToSignedUrl,
  submitFeedbackReport,
} from '../services/feedbackApi.js';
import { compressImage } from '../utils/compressImage.js';
import { FEEDBACK_CONFIG } from '../utils/constants.js';

export function useFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('bug');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [context, setContext] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);

  // Keep a stable idempotency key for retries of the same report
  const idempotencyKeyRef = useRef(uuidv4());

  /**
   * Open the feedback drawer/modal and gather fresh environment context
   */
  const openFeedback = useCallback((initialCategory = 'bug') => {
    setCategory(initialCategory);
    setContext(collectContext());
    setSubmitError(null);
    setSubmittedReport(null);
    idempotencyKeyRef.current = uuidv4();
    setIsOpen(true);
  }, []);

  /**
   * Close modal
   */
  const closeFeedback = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Reset form state completely
   */
  const resetForm = useCallback(() => {
    setDescription('');
    setAttachments([]);
    setSubmitError(null);
    setSubmittedReport(null);
    idempotencyKeyRef.current = uuidv4();
  }, []);

  /**
   * Add a screenshot or uploaded file to attachments list
   */
  const addAttachment = useCallback(
    async (fileBlob, filename = 'screenshot.png') => {
      if (attachments.length >= FEEDBACK_CONFIG.maxAttachments) {
        throw new Error(`Maximum ${FEEDBACK_CONFIG.maxAttachments} attachments allowed`);
      }

      // 1. Client-side compression if needed
      const compressedFile = await compressImage(fileBlob, { filename });
      const previewUrl = URL.createObjectURL(compressedFile);

      const newAttachment = {
        id: uuidv4(),
        file: compressedFile,
        filename: compressedFile.name || filename,
        previewUrl,
        fileSize: compressedFile.size,
        mimeType: compressedFile.type || 'image/png',
        storageKey: null,
        uploadStatus: 'idle', // 'idle' | 'uploading' | 'uploaded' | 'error'
        error: null,
      };

      setAttachments((prev) => [...prev, newAttachment]);
      return newAttachment;
    },
    [attachments.length]
  );

  /**
   * Remove an attachment by ID
   */
  const removeAttachment = useCallback((attachmentId) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === attachmentId);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.id !== attachmentId);
    });
  }, []);

  /**
   * Submit complete feedback report to backend
   */
  const submitFeedback = useCallback(async () => {
    if (isSubmitting) return;

    // Validate description length
    const trimmedDesc = description.trim();
    if (trimmedDesc.length < FEEDBACK_CONFIG.descriptionMinLength) {
      setSubmitError(
        `Please provide at least ${FEEDBACK_CONFIG.descriptionMinLength} characters in your description.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Upload any attachments that haven't been uploaded yet
      const uploadedAttachmentsMeta = [];

      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        let currentStorageKey = att.storageKey;

        if (!currentStorageKey) {
          // Update status to uploading
          setAttachments((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, uploadStatus: 'uploading' } : item))
          );

          // Step A: Request signed upload URL from backend
          const uploadMeta = await requestUploadUrl({
            originalFilename: att.filename,
            mimeType: att.mimeType,
            fileSize: att.fileSize,
          });

          // Step B: Upload file directly to Supabase storage signed URL
          await uploadFileToSignedUrl(uploadMeta.data.uploadUrl, att.file, att.mimeType);

          currentStorageKey = uploadMeta.data.storageKey;

          // Update status to uploaded
          setAttachments((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? { ...item, storageKey: currentStorageKey, uploadStatus: 'uploaded' }
                : item
            )
          );
        }

        uploadedAttachmentsMeta.push({
          storageKey: currentStorageKey,
          originalFilename: att.filename,
          mimeType: att.mimeType,
          fileSize: att.fileSize,
        });
      }

      // 2. Submit report to backend
      const reportPayload = {
        category,
        description: trimmedDesc,
        context: context || collectContext(),
        attachments: uploadedAttachmentsMeta,
      };

      const result = await submitFeedbackReport(reportPayload, idempotencyKeyRef.current);

      setSubmittedReport(result.data);
      resetForm();
    } catch (err) {
      console.error('[useFeedback] Submission failed:', err);
      // Retain description and uploaded attachments so user does not lose input
      setSubmitError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [category, description, attachments, context, isSubmitting, resetForm]);

  return {
    isOpen,
    category,
    setCategory,
    description,
    setDescription,
    attachments,
    context,
    isSubmitting,
    submitError,
    submittedReport,
    openFeedback,
    closeFeedback,
    resetForm,
    addAttachment,
    removeAttachment,
    submitFeedback,
  };
}

export default useFeedback;
