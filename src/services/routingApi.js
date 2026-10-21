const OSRM_PROVIDERS = {
  car: { baseUrl: 'https://router.project-osrm.org', profile: 'driving', source: 'OSRM / OpenStreetMap' },
  taxi: { baseUrl: 'https://router.project-osrm.org', profile: 'driving', source: 'OSRM / OpenStreetMap' },
  walk: { baseUrl: 'https://routing.openstreetmap.de/routed-foot', profile: 'driving', source: 'OSM foot routing' },
  bike: { baseUrl: 'https://routing.openstreetmap.de/routed-bike', profile: 'driving', source: 'OSM bicycle routing' },
};
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_TIMEOUT_MS = 8000;
const NOMINATIM_MIN_INTERVAL_MS = 1100;
let nextNominatimRequestAt = 0;

function validateCoordinates(coordinates, label) {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1]) ||
    coordinates[0] < -90 ||
    coordinates[0] > 90 ||
    coordinates[1] < -180 ||
    coordinates[1] > 180
  ) {
    throw new Error(`${label} debe tener latitud y longitud válidas.`);
  }
}

function getOsrmProfile(mode) {
  const provider = OSRM_PROVIDERS[mode];
  if (provider) return provider;
  if (mode === 'moto') return { ...OSRM_PROVIDERS.car, mode: 'moto' };
  throw new Error(`El cálculo de rutas para "${mode}" aún no está conectado a un proveedor real.`);
}

export async function getOsrmRoute(origin, dest, mode = 'car') {
  validateCoordinates(origin, 'El origen');
  validateCoordinates(dest, 'El destino');
  const provider = getOsrmProfile(mode);
  const url = `${provider.baseUrl}/route/v1/${provider.profile}/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`El servicio de rutas respondió con el estado ${response.status}.`);
    }

    const data = await response.json();
    const bestRoute = data.routes?.[0];
    const coordinates = bestRoute?.geometry?.coordinates;
    if (
      data.code !== 'Ok' ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !Number.isFinite(bestRoute.distance) ||
      !Number.isFinite(bestRoute.duration) ||
      coordinates.some((coordinate) => {
        if (!Array.isArray(coordinate) || coordinate.length !== 2) return true;
        const [lng, lat] = coordinate;
        return !Number.isFinite(lng) ||
          !Number.isFinite(lat) ||
          lng < -180 ||
          lng > 180 ||
          lat < -90 ||
          lat > 90;
      })
    ) {
      throw new Error('No se encontró una ruta vial entre esos puntos.');
    }

    return {
      polyline: coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: +(bestRoute.distance / 1000).toFixed(2),
      durationMin: Math.max(1, Math.round(bestRoute.duration / 60)),
      source: provider.source,
      mode,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('El servicio de rutas tardó demasiado. Intenta de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchAddressNominatim(query) {
  if (typeof query !== 'string' || query.trim().length < 3) {
    throw new Error('Escribe al menos 3 caracteres para buscar una dirección.');
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: `${query.trim()}, Cali, Valle del Cauca, Colombia`,
    limit: '6',
    addressdetails: '1',
    viewbox: '-76.80,3.65,-76.35,3.20',
    bounded: '1',
  });
  const requestTime = Date.now();
  const waitMs = Math.max(0, nextNominatimRequestAt - requestTime);
  nextNominatimRequestAt = Math.max(requestTime, nextNominatimRequestAt) + NOMINATIM_MIN_INTERVAL_MS;
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'es-CO,es;q=0.9' },
    });
    if (!response.ok) {
      throw new Error(`El buscador de direcciones respondió con el estado ${response.status}.`);
    }

    const results = await response.json();
    if (!Array.isArray(results)) {
      throw new Error('El buscador devolvió una respuesta inválida.');
    }

    return results
      .filter((item) => item && typeof item.display_name === 'string')
      .map((item) => ({
        id: item.place_id,
        name: item.display_name.split(',')[0],
        fullName: item.display_name,
        lat: Number.parseFloat(item.lat),
        lng: Number.parseFloat(item.lon),
        type: item.type || 'lugar',
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La búsqueda de direcciones tardó demasiado. Intenta de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function calculateMultimodalDetails(distanceKm) {
  const distance = Math.max(1.0, distanceKm);

  return [
    {
      id: 'car',
      name: 'Carro Compartido (estimación)',
      mode: 'car',
      timeMin: Math.round(distance * 1.9 + 5),
      costCop: 3500,
      safetyScore: 'No evaluado',
      co2Kg: +(distance * 0.17).toFixed(2),
      co2SavedKg: +(distance * 0.14).toFixed(2),
      recommendation: 'Estimación orientativa; no es una ruta verificada.',
      badgeClass: 'badge-sapphire',
    },
    {
      id: 'moto',
      name: 'Moto (estimación)',
      mode: 'moto',
      timeMin: Math.round(distance * 1.4 + 4),
      costCop: 3000,
      safetyScore: 'No evaluado',
      co2Kg: +(distance * 0.08).toFixed(2),
      co2SavedKg: +(distance * 0.09).toFixed(2),
      recommendation: 'Estimación orientativa; no es una ruta verificada.',
      badgeClass: 'badge-amber',
    },
    {
      id: 'mio',
      name: 'MIO (estimación)',
      mode: 'mio',
      timeMin: Math.round(distance * 3.2 + 10),
      costCop: 3000,
      safetyScore: 'No evaluado',
      co2Kg: +(distance * 0.04).toFixed(2),
      co2SavedKg: +(distance * 0.19).toFixed(2),
      recommendation: 'Sin integración GTFS: no incluye paradas ni horarios reales.',
      badgeClass: 'badge-emerald',
    },
    {
      id: 'bike',
      name: 'Bicicleta (estimación)',
      mode: 'bike',
      timeMin: Math.round(distance * 3.6 + 6),
      costCop: 0,
      safetyScore: 'No evaluado',
      co2Kg: 0,
      co2SavedKg: +(distance * 0.23).toFixed(2),
      recommendation: 'Estimación orientativa; no es una ruta verificada.',
      badgeClass: 'badge-emerald',
    },
    {
      id: 'walk',
      name: 'Caminata (estimación)',
      mode: 'walk',
      timeMin: Math.round(distance * 12 + 4),
      costCop: 0,
      safetyScore: 'No evaluado',
      co2Kg: 0,
      co2SavedKg: +(distance * 0.23).toFixed(2),
      recommendation: 'Estimación orientativa; no es una ruta verificada.',
      badgeClass: 'badge-purple',
    },
    {
      id: 'taxi',
      name: 'Taxi / App grupal (estimación)',
      mode: 'taxi',
      timeMin: Math.round(distance * 2 + 4),
      costCop: Math.round((distance * 1900 + 7500) / 4),
      safetyScore: 'No evaluado',
      co2Kg: +(distance * 0.16).toFixed(2),
      co2SavedKg: +(distance * 0.11).toFixed(2),
      recommendation: 'Estimación orientativa; no es una ruta verificada.',
      badgeClass: 'badge-amber',
    },
    {
      id: 'intermunicipal',
      name: 'Intermunicipal (estimación)',
      mode: 'intermunicipal',
      timeMin: Math.round(distance * 2.5 + 12),
      costCop: Math.round(distance * 1500),
      safetyScore: 'No evaluado',
      co2Kg: +(distance * 0.12).toFixed(2),
      co2SavedKg: +(distance * 0.1).toFixed(2),
      recommendation: 'Estimación orientativa; no es una ruta verificada.',
      badgeClass: 'badge-purple',
    },
  ];
}
