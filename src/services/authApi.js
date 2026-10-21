const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';
const TOKEN_KEY = 'viajau-auth-token';

function getTokenStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY) !== null
    ? window.localStorage
    : window.sessionStorage;
}

export function getAuthToken() {
  return getTokenStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function storeAuthToken(token, remember = false) {
  if (typeof window === 'undefined') return;
  clearAuthToken();
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, { token, ...options } = {}) {
  const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = Object.values(payload.errors || {}).flat();
    const error = new Error(validationErrors[0] || payload.message || 'No fue posible conectar con el servidor.');
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function registerAccount(data) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginAccount(data) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getCurrentAccount(token = getAuthToken()) {
  return request('/me', { token });
}

export function getTravelOffers(filters, token = getAuthToken(), signal) {
  const params = new URLSearchParams();
  for (const key of ['zone', 'time', 'faculty', 'university', 'transport']) {
    const value = filters[key]?.trim();
    if (value && value !== 'Cualquiera') params.set(key, value);
  }

  return request(`/trips${params.size ? `?${params}` : ''}`, { token, signal });
}

export function getTravelMatches(token = getAuthToken(), signal) {
  return request('/matches', { token, signal });
}

export function getMyTrips(token = getAuthToken(), signal) {
  return request('/trips/mine', { token, signal });
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

export function resolveSafetyAlert(alertId, token = getAuthToken()) {
  return request(`/security/alerts/${alertId}/resolve`, {
    method: 'PATCH',
    token,
  });
}

export function logoutAccount(token = getAuthToken()) {
  return request('/logout', { method: 'POST', token });
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
