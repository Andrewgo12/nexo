export const UNIVERSITY_DOMAINS = {
  uniajc: '@uniajc.edu.co',
  univalle: '@correounivalle.edu.co',
  javeriana: '@javerianacali.edu.co',
  icesi: '@icesi.edu.co'
};

export function validateInstitutionalEmail(email, domain) {
  if (!email || !domain) return false;
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedDomain = String(domain).trim().toLowerCase().replace(/^@/, '');
  const separatorIndex = normalizedEmail.indexOf('@');
  if (
    separatorIndex <= 0
    || separatorIndex !== normalizedEmail.lastIndexOf('@')
    || !normalizedDomain
    || /\s/.test(normalizedEmail)
  ) return false;

  return normalizedEmail.slice(separatorIndex + 1) === normalizedDomain;
}

export function calculateDistanceBetweenPoints(origin, destination) {
  const coordinates = [origin, destination].map((point) => ({
    rawLat: point?.lat,
    rawLng: point?.lng,
    lat: Number(point?.lat),
    lng: Number(point?.lng),
  }));
  if (coordinates.some(({ rawLat, rawLng, lat, lng }) => (
    rawLat == null || rawLng == null || String(rawLat).trim() === '' || String(rawLng).trim() === ''
    || !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180
  ))) {
    throw new Error('Se requieren coordenadas geográficas válidas para calcular la distancia.');
  }
  const [{ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 }] = coordinates;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((6371 * c).toFixed(2));
}

export function buildRouteSummary({ origin, destination, routeResult }) {
  const routeLabel = `${origin || 'UNIAJC'} → ${destination || 'El Caney'}`;
  if (!routeResult) {
    return {
      duration: 'Pendiente',
      distance: 'Pendiente',
      safety: 'No evaluado',
      routeLabel,
    };
  }

  return {
    duration: Number.isFinite(routeResult.durationMin) ? `${routeResult.durationMin} min` : 'Horario no disponible',
    distance: Number.isFinite(routeResult.distanceKm) ? `${routeResult.distanceKm.toFixed(1)} km` : 'Distancia no disponible',
    safety: routeResult.safetyScore || 'No evaluado',
    routeLabel,
  };
}
