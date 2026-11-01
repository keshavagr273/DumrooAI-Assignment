const API_BASE = '/api/feedback';

/**
 * Helper to handle fetch responses and standardize errors
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (isJson && data.message) ||
      (isJson && data.errors && data.errors.join(', ')) ||
      response.statusText ||
      'Request failed';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * 1. Request short-lived signed upload URL from backend
 */
export async function requestUploadUrl({ originalFilename, mimeType, fileSize }) {
  const res = await fetch(`${API_BASE}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ originalFilename, mimeType, fileSize }),
  });
  return handleResponse(res);
}

/**
 * 2. Upload raw file bytes directly to the signed upload URL (Supabase Storage)
 */
export async function uploadFileToSignedUrl(signedUploadUrl, fileBlob, mimeType) {
  // If it's a mock upload URL for dev/test
  if (signedUploadUrl.includes('mock-storage.local')) {
    console.log('[feedbackApi] Mock upload completed for dev environment.');
    return { success: true };
  }

  const res = await fetch(signedUploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType || fileBlob.type || 'image/png',
    },
    body: fileBlob,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload file to storage (${res.status}): ${text.slice(0, 150)}`);
  }

  return { success: true };
}

/**
 * 3. Submit complete feedback report with Idempotency-Key
 */
export async function submitFeedbackReport(feedbackPayload, idempotencyKey) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    credentials: 'include',
    body: JSON.stringify(feedbackPayload),
  });
  return handleResponse(res);
}

/**
 * 4. Fetch list of reports for the current user/organization
 */
export async function fetchMyReports({ page = 1, limit = 20, category, status } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (category) params.set('category', category);
  if (status) params.set('status', status);

  const res = await fetch(`${API_BASE}/my-reports?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(res);
}

/**
 * 5. Fetch a single report by ID
 */
export async function fetchFeedbackById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(res);
}

/**
 * 6. Update report status (admin only)
 */
export async function updateFeedbackStatus(id, status) {
  const res = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

/**
 * 7. Retry a failed notification outbox job (admin only)
 */
export async function retryNotificationJob(outboxId) {
  const res = await fetch(`${API_BASE}/notifications/${outboxId}/retry`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(res);
}

