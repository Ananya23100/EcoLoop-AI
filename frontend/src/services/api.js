/**
 * EcoLoop AI - API Service
 *
 * Handles all HTTP calls to the FastAPI backend.
 */

const API_BASE = '/api';

/**
 * Upload a product image to the backend.
 * @param {File} file - Image file (JPEG/PNG/WebP, max 10MB)
 * @returns {Promise<{image_key: string, preview_url: string}>}
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || error.detail || 'Upload failed');
  }

  return response.json();
}

/**
 * Run the AI assessment pipeline on an uploaded product.
 * @param {{image_key: string, product_category: string, product_age_months: number, original_price: number}} data
 * @returns {Promise<object>} Full assessment response
 */
export async function assessProduct(data) {
  const sessionId = getSessionId();

  const response = await fetch(`${API_BASE}/assess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || error.detail || 'Assessment failed');
  }

  return response.json();
}

/**
 * Get or create a session ID stored in localStorage.
 */
export function getSessionId() {
  let id = localStorage.getItem('ecoloop_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ecoloop_session_id', id);
  }
  return id;
}
