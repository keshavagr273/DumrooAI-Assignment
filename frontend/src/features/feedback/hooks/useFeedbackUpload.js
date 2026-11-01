import { useState, useCallback } from 'react';
import { FEEDBACK_CONFIG } from '../utils/constants.js';

export function useFeedbackUpload(addAttachment, currentCount) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const validateAndAddFiles = useCallback(
    async (fileList) => {
      setUploadError(null);
      const files = Array.from(fileList || []);
      if (files.length === 0) return;

      if (currentCount + files.length > FEEDBACK_CONFIG.maxAttachments) {
        setUploadError(`You can only attach up to ${FEEDBACK_CONFIG.maxAttachments} files in total.`);
        return;
      }

      for (const file of files) {
        // Validate MIME type
        if (!FEEDBACK_CONFIG.allowedMimeTypes.includes(file.type)) {
          setUploadError(`Invalid file type: ${file.name}. Only PNG, JPEG, and WebP images are allowed.`);
          return;
        }

        // Validate raw file size
        if (file.size > FEEDBACK_CONFIG.maxFileSizeBytes) {
          setUploadError(`File too large: ${file.name}. Maximum file size is ${FEEDBACK_CONFIG.maxFileSizeMb}MB.`);
          return;
        }

        try {
          await addAttachment(file, file.name);
        } catch (err) {
          setUploadError(err.message);
        }
      }
    },
    [addAttachment, currentCount]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer?.files) {
        await validateAndAddFiles(e.dataTransfer.files);
      }
    },
    [validateAndAddFiles]
  );

  const handleFileInputChange = useCallback(
    async (e) => {
      if (e.target?.files) {
        await validateAndAddFiles(e.target.files);
        e.target.value = ''; // Reset input so same file can be re-selected if removed
      }
    },
    [validateAndAddFiles]
  );

  return {
    isDragging,
    uploadError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
  };
}

export default useFeedbackUpload;

