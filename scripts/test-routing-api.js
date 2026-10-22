import assert from 'node:assert/strict';
import {
  clearAuthToken,
  getMyTrips,
  getTravelMatches,
  getTravelOffers,
  loginAccount,
  createSafetyAlert,
  createTripCheckIn,
  getTripSafetyStatus,
  getSafetyAlerts,
  resolveSafetyAlert,
  shareTripLocation,
  stopSharingTripLocation,
  publishTravelOffer,
  requestTravelSeat,
  updateTravelRequest,
  updateTravelOfferStatus,
} from '../src/services/authApi.js';
import { getOsrmRoute, searchAddressNominatim } from '../src/services/routingApi.js';
import { getCurrentDeviceLocation } from '../src/services/locationApi.js';
import { getMioRoute } from '../src/services/mioRoutingApi.js';
import { calculateCompatibilityScore, calculateTravelAffinityScore, filterTravelMatches } from '../src/services/viajauCore.js';
import { DEFAULT_APP_DATA, readAppData, writeAppData } from '../src/services/appDatabase.js';

const jsonResponse = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(payload),
});
const appStorage = new Map();
const localStorage = {
  getItem: (key) => appStorage.get(key) ?? null,
  setItem: (key, value) => appStorage.set(key, value),
  removeItem: (key) => appStorage.delete(key),
};
globalThis.window = { localStorage, sessionStorage: localStorage };
localStorage.setItem('viajau-local-db-v1', JSON.stringify({
  name: 'Ana Example',
  email: 'ana@example.com',
  emergency_contact: '+573001234567',
  activeTab: 'trips',
  executionState: 'not-an-array',
  notifications: [{ title: 'Injected label', channel: 'Injected channel', active: true }],
}));
const safeAppData = readAppData();
assert.equal(safeAppData.email, undefined);
assert.equal(safeAppData.emergency_contact, undefined);
assert.equal(safeAppData.notifications[0].title, DEFAULT_APP_DATA.notifications[0].title);
assert.equal(safeAppData.notifications[0].active, true);
assert.equal(JSON.parse(localStorage.getItem('viajau-local-db-v1')).name, undefined);
writeAppData({ name: 'Ana Example', email: 'ana@example.com', activeTab: 'profile' });
assert.equal(JSON.parse(localStorage.getItem('viajau-local-db-v1')).email, undefined);

globalThis.document = { cookie: '' };
const authRequests = [];
globalThis.fetch = async (url, options) => {
  authRequests.push({ url: String(url), options });
  if (String(url) === '/sanctum/csrf-cookie') {
    globalThis.document.cookie = 'XSRF-TOKEN=csrf%2Btoken';
    return { ok: true, status: 204 };
  }
  return jsonResponse({ user: { id: 1 } });
};
const loginResponse = await loginAccount({
  email: 'ana@example.com',
  password: 'password',
  remember: true,
});
assert.equal(loginResponse.user.id, 1);
assert.deepEqual(authRequests.map(({ url }) => url), ['/sanctum/csrf-cookie', '/api/login']);
assert.equal(authRequests[0].options.credentials, 'include');
assert.equal(authRequests[1].options.credentials, 'include');
assert.equal(authRequests[1].options.headers.get('X-XSRF-TOKEN'), 'csrf+token');
assert.equal(authRequests[1].options.headers.get('Authorization'), null);
localStorage.setItem('viajau-auth-token', 'stale-browser-token');
clearAuthToken();
assert.equal(localStorage.getItem('viajau-auth-token'), null);

globalThis.fetch = async () => jsonResponse(null, 200);
await assert.rejects(getTravelMatches(), (error) => {
  assert.equal(error.status, 200);
  assert.match(error.message, /JSON inválida/);
  return true;
});
globalThis.fetch = async () => ({
  ok: false,
  status: 503,
  text: async () => '<html>Unavailable</html>',
});
await assert.rejects(getTravelMatches(), (error) => {
  assert.equal(error.status, 503);
  assert.match(error.message, /503/);
  return true;
});

let fetchCalls = 0;
const requestedUrls = [];
globalThis.fetch = async (url) => {
  fetchCalls += 1;
  requestedUrls.push(String(url));
  if (String(url).includes('nominatim')) {
    return {
      ok: true,
      json: async () => [{
        place_id: 42,
        display_name: 'Universidad, Cali, Colombia',
        lat: '3.45',
        lon: '-76.53',
        type: 'university',
      }],
    };
  }
  return {
    ok: true,
    json: async () => ({
      code: 'Ok',
      routes: [{
        distance: 4200,
        duration: 900,
        geometry: { coordinates: [[-76.53, 3.45], [-76.52, 3.46]] },
      }],
    }),
  };
};

const route = await getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'car');
assert.deepEqual(route.polyline, [[3.45, -76.53], [3.46, -76.52]]);
assert.equal(route.distanceKm, 4.2);
assert.equal(route.durationMin, 15);
assert.equal(route.source, 'OSRM / OpenStreetMap');
assert.equal(route.mode, 'car');

const footRoute = await getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'walk');
assert.equal(footRoute.source, 'OSM foot routing');
assert.match(requestedUrls.at(-1), /routed-foot\/route\/v1\/driving/);
const bicycleRoute = await getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'bike');
assert.equal(bicycleRoute.source, 'OSM bicycle routing');
assert.match(requestedUrls.at(-1), /routed-bike\/route\/v1\/driving/);
const motoRoute = await getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'moto');
assert.equal(motoRoute.mode, 'moto');
assert.equal(motoRoute.source, 'OSRM / OpenStreetMap');

const callsBeforeUnsupportedMode = fetchCalls;
await assert.rejects(
  getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'scooter'),
  /aún no está conectado/,
);
assert.equal(fetchCalls, callsBeforeUnsupportedMode, 'unsupported modes must not call OSRM');

await assert.rejects(
  getOsrmRoute([200, -76.53], [3.46, -76.52], 'car'),
  /latitud y longitud válidas/,
);

const places = await searchAddressNominatim('Universidad');
assert.equal(places[0].lat, 3.45);
assert.equal(places[0].lng, -76.53);
assert.match(requestedUrls.at(-1), /bounded=1/);
assert.match(requestedUrls.at(-1), /viewbox=/);
await assert.rejects(searchAddressNominatim('ab'), /al menos 3 caracteres/);

const location = await getCurrentDeviceLocation({
  getCurrentPosition(success, _failure, options) {
    assert.equal(options.enableHighAccuracy, true);
    success({ coords: { latitude: 3.45, longitude: -76.53, accuracy: 12 } });
  },
});
assert.deepEqual(location, { lat: 3.45, lng: -76.53, accuracy: 12 });

await assert.rejects(
  getCurrentDeviceLocation({
    getCurrentPosition(_success, failure) {
      failure({ code: 1 });
    },
  }),
  /Permite el acceso/,
);

await assert.rejects(
  getCurrentDeviceLocation({
    getCurrentPosition(success) {
      success({ coords: { latitude: 91, longitude: -76.53, accuracy: 12 } });
    },
  }),
  /coordenadas de ubicación inválidas/,
);

globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({ code: 'NoRoute', routes: [] }),
});
await assert.rejects(
  getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'car'),
  /No se encontró una ruta vial/,
);

globalThis.fetch = async () => ({
  ok: false,
  status: 503,
});
await assert.rejects(
  getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'car'),
  /estado 503/,
);

const mioPageOffsets = [];
globalThis.fetch = async (url, options = {}) => {
  const urlText = String(url);
  if (urlText.includes('/FeatureServer/')) {
    const layerId = Number(urlText.match(/FeatureServer\/(\d+)/)?.[1]);
    const parameters = new URLSearchParams(options.body);
    if (layerId === 0) {
      const [west, , east] = parameters.get('geometry').split(',').map(Number);
      const isOrigin = (west + east) / 2 < -76.525;
      return {
        ok: true,
        json: async () => ({
          features: [{
            attributes: { ID: isOrigin ? 101 : 202, GStopID: isOrigin ? 'STOP-A' : 'STOP-B' },
            geometry: { x: isOrigin ? -76.53 : -76.52, y: isOrigin ? 3.45 : 3.46 },
          }],
        }),
      };
    }
    if (layerId === 1 && parameters.get('where').startsWith('FromStopID')) {
      mioPageOffsets.push(Number(parameters.get('resultOffset')));
      return {
        ok: true,
        json: async () => ({
          features: [{ attributes: { LineVarID: 11 } }],
          ...(parameters.get('resultOffset') === '0' ? { exceededTransferLimit: true } : {}),
        }),
      };
    }
    if (layerId === 5) {
      return {
        ok: true,
        json: async () => ({
          features: [{
            attributes: { ID: 11, LineID: 7, GDirectionID: 1, GShapeID: 'R7-S1-D1-SERVICE' },
          }],
        }),
      };
    }
    if (layerId === 1) {
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              attributes: { LineVarID: 11, SqIdx: 1, FromStopID: 101, ToStopID: 150, Shape__Length: 1000 },
              geometry: { paths: [[[-76.53, 3.45], [-76.525, 3.455]]] },
            },
            {
              attributes: { LineVarID: 11, SqIdx: 2, FromStopID: 150, ToStopID: 202, Shape__Length: 1200 },
              geometry: { paths: [[[-76.525, 3.455], [-76.52, 3.46]]] },
            },
          ],
        }),
      };
    }
  }

  return {
    ok: true,
    json: async () => ({
      code: 'Ok',
      routes: [{
        distance: 1250,
        duration: 600,
        geometry: { coordinates: [[-76.53, 3.45], [-76.525, 3.455]] },
      }],
    }),
  };
};

const mioRoute = await getMioRoute([3.45, -76.53], [3.46, -76.52]);
assert.equal(mioRoute.mode, 'mio');
assert.deepEqual(mioRoute.routes, ['R7']);
assert.deepEqual(mioRoute.stops, ['STOP-A', 'STOP-B']);
assert.deepEqual(mioRoute.stopDetails, [
  { code: 'STOP-A', coords: [3.45, -76.53], role: 'Abordaje' },
  { code: 'STOP-B', coords: [3.46, -76.52], role: 'Descenso' },
]);
assert.equal(mioRoute.distanceKm, 4.7);
assert.equal(mioRoute.scheduleAvailable, false);
assert.equal('durationMin' in mioRoute, false);
assert.ok(mioRoute.polyline.length >= 3);
assert.deepEqual(mioPageOffsets.sort((a, b) => a - b), [0, 0, 2000, 2000]);

assert.equal(calculateTravelAffinityScore(
  { neighborhood: 'El Caney', transport: 'MIO + caminata', shift: 'Nocturna' },
  { zone: 'El Caney UNIAJC', time: '19:45', transport: 'MIO + caminata' },
), 100);
assert.equal(calculateTravelAffinityScore(
  { neighborhood: 'Pance', transport: 'Carro', shift: 'Diurna' },
  { zone: 'El Caney UNIAJC', time: '19:45', transport: 'MIO' },
), 0);
assert.equal(calculateCompatibilityScore(
  { neighborhood: 'El Caney', shift: 'Nocturna', transport: 'MIO + caminata', trustScore: 4.8 },
  { zone: 'El Caney', time: '19:45', transport: 'MIO + caminata' },
), 99, 'existing match scoring remains stable for other modules');
assert.deepEqual(filterTravelMatches({
  zone: '',
  time: '',
  faculty: '',
  university: 'UNIAJC',
  transport: 'Cualquiera',
  sort: 'Más recientes',
}, [
  { name: 'Oferta anterior', university: 'UNIAJC', created_at: '2026-10-19T10:00:00Z' },
  { name: 'Oferta nueva', university: 'UNIAJC', created_at: '2026-10-20T10:00:00Z' },
  { name: 'Otra universidad', university: 'Icesi', created_at: '2026-10-21T10:00:00Z' },
]).map(({ name }) => name), ['Oferta nueva', 'Oferta anterior']);

let offersRequest;
globalThis.document = { cookie: 'XSRF-TOKEN=test-xsrf-token' };
globalThis.fetch = async (url, options) => {
  offersRequest = { url: String(url), options };
  return jsonResponse({ data: [] });
};
const offersResponse = await getTravelOffers({
  zone: 'El Caney',
  time: '19:45',
  faculty: 'Ingeniería',
  university: 'UNIAJC',
  transport: 'MIO',
  sort: 'Compatibilidad',
}, 'test-session-token');
assert.deepEqual(offersResponse.data, []);
const offersUrl = new URL(offersRequest.url, 'http://localhost');
assert.equal(offersUrl.pathname, '/api/trips');
assert.equal(offersUrl.searchParams.get('zone'), 'El Caney');
assert.equal(offersUrl.searchParams.get('time'), '19:45');
assert.equal(offersUrl.searchParams.get('faculty'), 'Ingeniería');
assert.equal(offersUrl.searchParams.get('university'), 'UNIAJC');
assert.equal(offersUrl.searchParams.get('transport'), 'MIO');
assert.equal(offersUrl.searchParams.has('sort'), false);
assert.equal(offersRequest.options.headers.get('Authorization'), null);
assert.equal(offersRequest.options.credentials, 'include');

globalThis.fetch = async (url, options) => {
  offersRequest = { url: String(url), options };
  return jsonResponse({ data: [], meta: { profile_available: true } });
};
const matchesResponse = await getTravelMatches('test-session-token');
assert.deepEqual(matchesResponse.data, []);
assert.equal(new URL(offersRequest.url, 'http://localhost').pathname, '/api/matches');
assert.equal(offersRequest.options.headers.get('Authorization'), null);
assert.equal(offersRequest.options.credentials, 'include');

const tripApiCalls = [];
globalThis.fetch = async (url, options) => {
  tripApiCalls.push({ url: String(url), options });
  return jsonResponse({ data: { offers: [], requests: [] } });
};
await getMyTrips('test-session-token');
await publishTravelOffer({ origin: 'El Caney', destination: 'UNIAJC' }, 'test-session-token');
await requestTravelSeat(12, 'test-session-token');
await updateTravelRequest(7, 'accepted', 'test-session-token');
await updateTravelOfferStatus(12, 'en-curso', 'test-session-token');
assert.deepEqual(tripApiCalls.map(({ url }) => new URL(url, 'http://localhost').pathname), [
  '/api/trips/mine',
  '/api/trips',
  '/api/trips/12/requests',
  '/api/trip-requests/7',
  '/api/trips/12',
]);
assert.equal(tripApiCalls[1].options.method, 'POST');
assert.deepEqual(JSON.parse(tripApiCalls[1].options.body), { origin: 'El Caney', destination: 'UNIAJC' });
assert.equal(tripApiCalls[2].options.method, 'POST');
assert.equal(tripApiCalls[3].options.method, 'PATCH');
assert.deepEqual(JSON.parse(tripApiCalls[3].options.body), { status: 'accepted' });
assert.deepEqual(JSON.parse(tripApiCalls[4].options.body), { status: 'en-curso' });
assert.equal(tripApiCalls[0].options.headers.get('Authorization'), null);
assert.equal(tripApiCalls[1].options.headers.get('X-XSRF-TOKEN'), 'test-xsrf-token');
assert.equal(tripApiCalls[1].options.credentials, 'include');

const safetyTripApiCalls = [];
globalThis.fetch = async (url, options) => {
  safetyTripApiCalls.push({ url: String(url), options });
  return jsonResponse({ data: { locations: [], check_ins: [] } });
};
await shareTripLocation(44, { latitude: 3.45, longitude: -76.53 }, 'test-session-token');
await stopSharingTripLocation(44, 'test-session-token');
await getTripSafetyStatus(44, 'test-session-token');
await createTripCheckIn(44, 'arrival', 'test-session-token');
assert.deepEqual(safetyTripApiCalls.map(({ url }) => new URL(url, 'http://localhost').pathname), [
  '/api/trips/44/location',
  '/api/trips/44/location',
  '/api/trips/44/safety',
  '/api/trips/44/check-ins',
]);
assert.equal(safetyTripApiCalls[0].options.method, 'POST');
assert.deepEqual(JSON.parse(safetyTripApiCalls[0].options.body), { latitude: 3.45, longitude: -76.53 });
assert.equal(safetyTripApiCalls[1].options.method, 'DELETE');
assert.equal(safetyTripApiCalls[2].options.method, undefined);
assert.equal(safetyTripApiCalls[3].options.method, 'POST');
assert.deepEqual(JSON.parse(safetyTripApiCalls[3].options.body), { type: 'arrival' });

const safetyApiCalls = [];
globalThis.fetch = async (url, options) => {
  safetyApiCalls.push({ url: String(url), options });
  return jsonResponse({ data: [] });
};
await createSafetyAlert({ latitude: 3.45, longitude: -76.53 }, 'test-session-token');
await getSafetyAlerts('test-session-token');
await resolveSafetyAlert(17, 'test-session-token');
assert.deepEqual(safetyApiCalls.map(({ url }) => new URL(url, 'http://localhost').pathname), [
  '/api/alerts',
  '/api/security/alerts',
  '/api/security/alerts/17/resolve',
]);
assert.equal(safetyApiCalls[0].options.method, 'POST');
assert.deepEqual(JSON.parse(safetyApiCalls[0].options.body), { latitude: 3.45, longitude: -76.53 });
assert.equal(safetyApiCalls[1].options.method, undefined);
assert.equal(safetyApiCalls[2].options.method, 'PATCH');
assert.equal(safetyApiCalls[0].options.headers.get('Authorization'), null);
assert.equal(safetyApiCalls[0].options.headers.get('X-XSRF-TOKEN'), 'test-xsrf-token');
assert.equal(safetyApiCalls[0].options.credentials, 'include');

globalThis.fetch = async () => {
  throw new TypeError('offline');
};
await assert.rejects(
  getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'car'),
  /offline/,
);

console.log('Routing and travel API tests passed.');
