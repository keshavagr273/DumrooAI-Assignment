import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file if it exceeds size limits or high resolution
 * @param {File|Blob} file
 * @param {Object} [options]
 * @returns {Promise<File>}
 */
export async function compressImage(file, options = {}) {
  // If file is already below 1MB, skip heavy compression
  if (file.size <= 1024 * 1024) {
    return file instanceof File ? file : new File([file], options.filename || 'screenshot.png', { type: file.type });
  }

  const defaultOptions = {
    maxSizeMB: 2, // Target under 2MB
    maxWidthOrHeight: 1920, // Downscale ultra-high-res displays to 1080p width
    useWebWorker: true,
    fileType: file.type || 'image/png',
    initialQuality: 0.85,
    ...options,
  };

  try {
    const compressedBlob = await imageCompression(file, defaultOptions);
    const filename = file.name || options.filename || 'screenshot.png';
    return new File([compressedBlob], filename, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('[compressImage] Compression failed or unsupported, using original file:', err);
    return file instanceof File ? file : new File([file], options.filename || 'screenshot.png', { type: file.type });
  }
}

export default compressImage;
