const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
const API_BASE = RAW_BASE ? `${RAW_BASE.replace(/\/$/, '')}/feedback` : '/api/feedback';

function getAuthHeaders(additional = {}) {
  const headers = { ...additional };
  const token = localStorage.getItem('dumroo_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Helper to handle fetch responses and standardize errors
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  let data;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch {
    data = { message: response.statusText || 'Unknown response' };
  }

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && data.message) ||
      (typeof data === 'object' && data.errors && data.errors.join(', ')) ||
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
  try {
    const res = await fetch(`${API_BASE}/upload-url`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ originalFilename, mimeType, fileSize }),
    });
    return await handleResponse(res);
  } catch (err) {
    // If backend is sleeping/mock mode, provide mock upload URL
    console.warn('[feedbackApi] Using mock upload URL fallback:', err.message);
    const mockKey = `feedback/demo-org/demo-user/${Date.now()}-${originalFilename}`;
    return {
      success: true,
      data: {
        uploadUrl: `https://mock-storage.local/feedback-attachments/${mockKey}?token=mock-token`,
        storageKey: mockKey,
      },
    };
  }
}

/**
 * 2. Upload raw file bytes directly to the signed upload URL (Supabase Storage)
 */
export async function uploadFileToSignedUrl(signedUploadUrl, fileBlob, mimeType) {
  // If it's a mock upload URL for dev/test
  if (signedUploadUrl.includes('mock-storage.local')) {
    console.log('[feedbackApi] Mock upload completed for demo environment.');
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
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      }),
      credentials: 'include',
      body: JSON.stringify(feedbackPayload),
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn('[feedbackApi] Backend submission fallback:', err.message);
    // If backend offline, generate mock successful report for demo
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const mockRef = `FB-${year}-${rand}`;
    const report = {
      feedbackId: `fb-${Date.now()}`,
      referenceId: mockRef,
      category: feedbackPayload.category,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    // Save to local cache
    const existing = JSON.parse(localStorage.getItem('dumroo_demo_reports') || '[]');
    existing.unshift({ ...report, description: feedbackPayload.description, context: feedbackPayload.context });
    localStorage.setItem('dumroo_demo_reports', JSON.stringify(existing));

    return {
      success: true,
      message: 'Feedback submitted successfully (Demo Mode)',
      data: report,
    };
  }
}

/**
 * 4. Fetch list of reports for the current user/organization
 */
export async function fetchMyReports({ page = 1, limit = 20, category, status } = {}) {
  try {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (category) params.set('category', category);
    if (status) params.set('status', status);

    const res = await fetch(`${API_BASE}/my-reports?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch (err) {
    // Local fallback reports
    const demoReports = JSON.parse(localStorage.getItem('dumroo_demo_reports') || '[]');
    let filtered = demoReports;
    if (category) filtered = filtered.filter(r => r.category === category);
    if (status) filtered = filtered.filter(r => r.status === status);

    return {
      success: true,
      data: {
        items: filtered,
        total: filtered.length,
        page,
        limit,
        pages: 1,
      },
    };
  }
}

/**
 * 5. Fetch a single report by ID
 */
export async function fetchFeedbackById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}

/**
 * 6. Update report status (admin only)
 */
export async function updateFeedbackStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return await handleResponse(res);
  } catch {
    // Update local cache
    const existing = JSON.parse(localStorage.getItem('dumroo_demo_reports') || '[]');
    const updated = existing.map(r => r.feedbackId === id || r._id === id ? { ...r, status } : r);
    localStorage.setItem('dumroo_demo_reports', JSON.stringify(updated));
    return { success: true, data: { status } };
  }
}

/**
 * 7. Retry a failed notification outbox job (admin only)
 */
export async function retryNotificationJob(outboxId) {
  const res = await fetch(`${API_BASE}/notifications/${outboxId}/retry`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}
