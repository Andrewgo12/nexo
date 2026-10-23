export const UNIVERSITY_DOMAINS = {
  uniajc: '@uniajc.edu.co',
  univalle: '@correounivalle.edu.co',
  javeriana: '@javerianacali.edu.co',
  icesi: '@icesi.edu.co'
};

export function validateInstitutionalEmail(email, domain) {
  if (!email || !domain) return false;
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedDomain = String(domain).trim().toLowerCase();
  return normalizedEmail.endsWith(normalizedDomain) && normalizedEmail.includes('@');
}

export function createStudentProfile(data = {}) {
  const now = new Date().toISOString();
  return {
    id: `stu-${Math.random().toString(36).slice(2, 9)}`,
    name: data.name || 'Estudiante ViajaU',
    email: data.email || 'estudiante@universidad.edu.co',
    university: data.university || 'UNIAJC',
    career: data.career || 'Ingeniería de Sistemas',
    semester: data.semester || '8vo',
    shift: data.shift || 'Nocturna',
    neighborhood: data.neighborhood || 'El Caney',
    transport: data.transport || 'MIO + caminata',
    emergencyContact: data.emergency || 'Contacto de confianza',
    privacy: data.privacy || 'Zona aproximada',
    verified: true,
    trustScore: 4.8,
    createdAt: now,
    updatedAt: now
  };
}

export function calculateDistanceBetweenPoints(origin, destination) {
  const lat1 = Number(origin?.lat ?? 3.45);
  const lng1 = Number(origin?.lng ?? -76.5);
  const lat2 = Number(destination?.lat ?? 3.52);
  const lng2 = Number(destination?.lng ?? -76.53);
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
