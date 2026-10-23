const API_BASE_URL = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');
const API_ROOT_URL = API_BASE_URL.replace(/\/api(?:\/v\d+)?$/, '');
const TOKEN_KEY = 'viajau-auth-token';
const REQUEST_TIMEOUT_MS = 15000;
let csrfCookiePromise;

function createTimeoutError() {
  const error = new Error('La solicitud tardó demasiado. Intenta de nuevo.');
  error.name = 'TimeoutError';
  error.status = 408;
  return error;
}

async function withRequestTimeout(operation, callerSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abortRequest = () => controller.abort(callerSignal.reason);
  if (callerSignal?.aborted) {
    abortRequest();
  } else {
    callerSignal?.addEventListener('abort', abortRequest, { once: true });
  }

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (timedOut) throw createTimeoutError();
    throw error;
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortRequest);
  }
}

function fetchWithTimeout(url, options) {
  return withRequestTimeout((signal) => fetch(url, { ...options, signal }), options.signal);
}

function getXsrfToken() {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='));
  if (!cookie) return null;
  return decodeURIComponent(cookie.slice('XSRF-TOKEN='.length));
}

async function readJsonResponse(response) {
  const body = await response.text();
  if (!body) {
    if (response.status === 204 || !response.ok) return {};
    const error = new Error('El servidor devolvió una respuesta JSON vacía.');
    error.status = response.status;
    throw error;
  }
  try {
    const payload = JSON.parse(body);
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new TypeError('Expected a JSON object response.');
    }
    return payload;
  } catch {
    const error = new Error(response.ok
      ? 'El servidor devolvió una respuesta JSON inválida.'
      : `El servidor respondió con el estado ${response.status} y un cuerpo JSON inválido.`);
    error.status = response.status;
    throw error;
  }
}

async function ensureCsrfCookie(force = false) {
  if (!force && getXsrfToken()) return;
  csrfCookiePromise ??= fetchWithTimeout(`${API_ROOT_URL}/sanctum/csrf-cookie`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  }).then((response) => {
    if (!response.ok) throw new Error('No fue posible iniciar la protección CSRF de la sesión.');
  }).finally(() => {
    csrfCookiePromise = undefined;
  });
  await csrfCookiePromise;
  if (!getXsrfToken()) {
    throw new Error('El servidor no devolvió la cookie CSRF. Verifica el dominio y la configuración de cookies.');
  }
}

export function getAuthToken() {
  return null;
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  csrfCookiePromise = undefined;
}

async function request(path, requestOptions = {}) {
  const options = { ...requestOptions };
  delete options.token;
  const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const method = (options.method || 'GET').toUpperCase();
  const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  return withRequestTimeout(async (signal) => {
    if (isUnsafeMethod) await ensureCsrfCookie();
    const sendRequest = () => {
      const xsrfToken = getXsrfToken();
      const headers = new Headers(options.headers);
      headers.set('Accept', 'application/json');
      if (isMultipart) {
        headers.delete('Content-Type');
      } else if (options.body != null && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      headers.delete('Authorization');
      if (isUnsafeMethod && xsrfToken) headers.set('X-XSRF-TOKEN', xsrfToken);
      return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers,
        signal,
      });
    };

    let response = await sendRequest();
    if (response.status === 419 && isUnsafeMethod) {
      csrfCookiePromise = undefined;
      await ensureCsrfCookie(true);
      response = await sendRequest();
    }
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      const validationErrors = Object.values(payload.errors || {}).flat();
      const error = new Error(validationErrors[0] || payload.message || `La solicitud falló con el estado ${response.status}.`);
      error.status = response.status;
      throw error;
    }

    return payload;
  }, options.signal);
}

export function registerAccount(data) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginAccount(data) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getCurrentAccount(token = getAuthToken()) {
  return request('/auth/me', { token });
}

export function getAccountDataExport(token = getAuthToken(), signal) {
  return request('/account/export', { token, signal });
}

export function getTravelOffers(filters, token = getAuthToken(), signal) {
  const params = new URLSearchParams();
  for (const key of [
    'zone',
    'time',
    'faculty',
    'university',
    'transport',
    'date_from',
    'date_to',
  ]) {
    const value = filters[key]?.trim();
    if (value && value !== 'Cualquiera') params.set(key, value);
  }
  if (Number.isSafeInteger(filters.after_id) && filters.after_id > 0) {
    params.set('after_id', String(filters.after_id));
  }

  return request(`/trips${params.size ? `?${params}` : ''}`, { token, signal });
}

export function getTravelMatches(token = getAuthToken(), signal, afterId = null) {
  const query = Number.isSafeInteger(afterId) && afterId > 0
    ? `?after_id=${afterId}`
    : '';
  return request(`/matches${query}`, { token, signal });
}

export function getMyTrips(token = getAuthToken(), signal) {
  return request('/trips/mine', { token, signal });
}

export function getCommunicationTrips(token = getAuthToken(), signal) {
  return request('/communication/trips', { token, signal });
}

export function getTripMessages(tripId, token = getAuthToken(), signal, cursor = {}) {
  if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
    throw new TypeError('El cursor del chat debe ser un objeto.');
  }
  const hasSinceId = cursor.sinceId !== undefined;
  const hasBeforeId = cursor.beforeId !== undefined;
  if (hasSinceId && hasBeforeId) {
    throw new TypeError('El cursor del chat no puede incluir sinceId y beforeId al mismo tiempo.');
  }
  if (hasSinceId && (!Number.isSafeInteger(cursor.sinceId) || cursor.sinceId < 0)) {
    throw new RangeError('sinceId debe ser un entero seguro mayor o igual a cero.');
  }
  if (hasBeforeId && (!Number.isSafeInteger(cursor.beforeId) || cursor.beforeId < 1)) {
    throw new RangeError('beforeId debe ser un entero seguro mayor que cero.');
  }
  const query = hasSinceId
    ? `?since_id=${cursor.sinceId}`
    : hasBeforeId
      ? `?before_id=${cursor.beforeId}`
      : '';
  return request(`/trips/${tripId}/messages${query}`, { token, signal });
}

export function sendTripMessage(tripId, body, token = getAuthToken()) {
  return request(`/trips/${tripId}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ body }),
  });
}

export function getMyReputation(token = getAuthToken(), signal) {
  return request('/reputation/me', { token, signal });
}

export function getProfileReputation(profileId, token = getAuthToken(), signal) {
  return request(`/reputation/profiles/${profileId}`, { token, signal });
}

export function submitTripReview(tripId, data, token = getAuthToken()) {
  return request(`/trips/${tripId}/reviews`, { method: 'POST', token, body: JSON.stringify(data) });
}

export function submitTripReport(tripId, data, token = getAuthToken()) {
  return request(`/trips/${tripId}/reports`, { method: 'POST', token, body: JSON.stringify(data) });
}

export function getAdminReports(status = 'open', token = getAuthToken(), signal, page = 1) {
  return request(`/admin/reports?status=${encodeURIComponent(status)}&page=${page}`, { token, signal });
}

export function moderateAdminReport(reportId, data, token = getAuthToken()) {
  return request(`/admin/reports/${reportId}`, { method: 'PATCH', token, body: JSON.stringify(data) });
}

export function getInsuranceProducts(token = getAuthToken(), signal) {
  return request('/insurance/products', { token, signal });
}

export function getMyMembership(token = getAuthToken(), signal) {
  return request('/membership', { token, signal });
}

export function createWompiMembershipCheckout(token = getAuthToken()) {
  return request('/membership/wompi/checkout', { method: 'POST', token });
}

export function getMyInsuranceEnrollments(token = getAuthToken(), signal) {
  return request('/insurance/enrollments/mine', { token, signal });
}

export function requestInsuranceQuote(productKey, token = getAuthToken()) {
  return request('/insurance/enrollments', {
    method: 'POST',
    token,
    body: JSON.stringify({ product_key: productKey }),
  });
}

export function submitInsurancePolicy(enrollmentId, formData, token = getAuthToken()) {
  return request(`/insurance/enrollments/${enrollmentId}/policy`, {
    method: 'POST',
    token,
    body: formData,
  });
}

export function getAdminInsuranceEnrollments(token = getAuthToken(), signal) {
  return request('/admin/insurance/enrollments', { token, signal });
}

export function updateAdminInsuranceEnrollment(enrollmentId, data, token = getAuthToken()) {
  return request(`/admin/insurance/enrollments/${enrollmentId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });
}

export async function downloadAdminInsurancePolicy(enrollmentId) {
  return withRequestTimeout(async (signal) => {
    const response = await fetch(`${API_BASE_URL}/admin/insurance/enrollments/${enrollmentId}/document`, {
      credentials: 'include',
      headers: {
        Accept: 'application/pdf',
      },
      signal,
    });
    if (!response.ok) {
      const payload = await readJsonResponse(response);
      const error = new Error(payload.message || `No fue posible descargar el documento de póliza (estado ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return response.blob();
  });
}

export function publishTravelOffer(data, token = getAuthToken()) {
  return request('/trips', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export function requestTravelSeat(offerId, token = getAuthToken()) {
  return request(`/trips/${offerId}/requests`, { method: 'POST', token });
}

export function updateTravelRequest(requestId, status, token = getAuthToken()) {
  return request(`/trip-requests/${requestId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}

export function updateTravelOfferStatus(offerId, status, token = getAuthToken()) {
  return request(`/trips/${offerId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}

export function shareTripLocation(tripId, location, token = getAuthToken()) {
  return request(`/trips/${tripId}/location`, {
    method: 'POST',
    token,
    body: JSON.stringify(location),
  });
}

export function stopSharingTripLocation(tripId, token = getAuthToken()) {
  return request(`/trips/${tripId}/location`, { method: 'DELETE', token });
}

export function getTripSafetyStatus(tripId, token = getAuthToken(), signal) {
  return request(`/trips/${tripId}/safety`, { token, signal });
}

export function createTripCheckIn(tripId, type, token = getAuthToken()) {
  return request(`/trips/${tripId}/check-ins`, {
    method: 'POST',
    token,
    body: JSON.stringify({ type }),
  });
}

export function createSafetyAlert(location = {}, token = getAuthToken()) {
  return request('/alerts', {
    method: 'POST',
    token,
    body: JSON.stringify(location),
  });
}

export function getSafetyAlerts(token = getAuthToken(), signal) {
  return request('/security/alerts', { token, signal });
}

export function getAdminDashboard(token = getAuthToken(), signal) {
  return request('/dashboard', { token, signal });
}

export function getAdminUsers(filters = {}, token = getAuthToken(), signal) {
  const params = new URLSearchParams();
  for (const key of ['status', 'verification', 'search', 'page']) {
    if (filters[key]) params.set(key, filters[key]);
  }
  return request(`/admin/users?${params}`, { token, signal });
}

export function updateAdminUser(userId, data, token = getAuthToken()) {
  return request(`/admin/users/${userId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });
}

export function getAdminIncidents(status = 'active', token = getAuthToken(), signal, page = 1) {
  return request(`/admin/incidents?status=${encodeURIComponent(status)}&page=${page}`, { token, signal });
}

export function getInstitutionalCatalog(university, token = getAuthToken(), signal) {
  const params = new URLSearchParams();
  if (university) params.set('university', university);
  return request(`/admin/catalog?${params}`, { token, signal });
}

export function createInstitutionalCatalogEntry(data, token = getAuthToken()) {
  return request('/admin/catalog', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export function deactivateInstitutionalCatalogEntry(entryId, token = getAuthToken()) {
  return request(`/admin/catalog/${entryId}`, { method: 'DELETE', token });
}

export function importTransitFeed(data, token = getAuthToken()) {
  const body = new FormData();
  body.append('feed_version', data.feed_version);
  body.append('stops', data.stops);
  body.append('routes', data.routes);
  return request('/admin/transit-feed/import', { method: 'POST', token, body });
}

export function getLatestTransitFeed(token = getAuthToken(), signal) {
  return request('/admin/transit-feed/latest', { token, signal });
}

export function resolveSafetyAlert(alertId, token = getAuthToken()) {
  return request(`/security/alerts/${alertId}/resolve`, {
    method: 'PATCH',
    token,
  });
}

export function logoutAccount(token = getAuthToken()) {
  return request('/auth/logout', { method: 'POST', token });
}

export function resendVerification(token = getAuthToken()) {
  return request('/auth/email/verification-notification', { method: 'POST', token });
}

export function updateCurrentProfile(data, token = getAuthToken()) {
  return request('/auth/profile', {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export function uploadProfilePhoto(photo, token = getAuthToken()) {
  const body = new FormData();
  body.append('photo', photo);

  return request('/profile/photo', {
    method: 'POST',
    token,
    body,
  });
}

export function changePassword(data, token = getAuthToken()) {
  return request('/auth/change-password', {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export function requestPasswordReset(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(data) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
