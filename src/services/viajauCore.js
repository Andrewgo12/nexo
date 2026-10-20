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

export function buildRouteSummary({ origin, destination, mode = 'MIO + caminata', routeResult }) {
  const baseDistance = routeResult?.distanceKm ?? 8.4;
  const durationMin = routeResult?.durationMin ?? (mode.includes('Moto') ? 18 : mode.includes('Carro') ? 24 : mode.includes('Bicicleta') ? 30 : 35);
  const safetyScore = durationMin <= 20 ? '94/100' : baseDistance > 10 ? '88/100' : '91/100';

  return {
    duration: `${durationMin} min`,
    distance: `${baseDistance.toFixed(1)} km`,
    safety: safetyScore,
    routeLabel: `${origin || 'UNIAJC'} → ${destination || 'El Caney'}`
  };
}

export function calculateCompatibilityScore(student, trip) {
  const base = 54;
  const zoneBonus = trip.zone && student.neighborhood ? (String(trip.zone).toLowerCase().includes(String(student.neighborhood).toLowerCase()) ? 22 : 6) : 12;
  const timeBonus = trip.time && String(trip.time).startsWith(String(student.shift || 'Nocturna').slice(0, 2)) ? 12 : 6;
  const routeBonus = trip.transport && student.transport ? (String(trip.transport).toLowerCase().includes(String(student.transport).split(' ')[0].toLowerCase()) ? 10 : 4) : 4;
  const trustBonus = Math.min(18, Number(student.trustScore || 4.8) * 3.5);
  return Math.min(99, Math.max(70, Math.round(base + zoneBonus + timeBonus + routeBonus + trustBonus)));
}

export function filterTravelMatches(searchState, candidates = []) {
  return [...candidates].filter((item) => {
    const zoneMatch = !searchState.zone || item.zone.toLowerCase().includes(searchState.zone.toLowerCase());
    const timeMatch = !searchState.time || item.time.startsWith(searchState.time.slice(0, 2));
    const facultyMatch = !searchState.faculty || item.faculty.toLowerCase().includes(searchState.faculty.toLowerCase());
    const transportMatch = !searchState.transport || searchState.transport === 'Cualquiera' || item.transport.toLowerCase().includes(searchState.transport.toLowerCase());
    const confidenceMatch = !searchState.confidence || searchState.confidence === 'Cualquiera' || Number(searchState.confidence.replace('+', '')) <= item.score;
    const genderMatch = !searchState.gender || searchState.gender === 'Cualquiera' || item.gender === searchState.gender;
    return zoneMatch && timeMatch && facultyMatch && transportMatch && confidenceMatch && genderMatch;
  }).sort((a, b) => {
    if (searchState.sort === 'Distancia') return a.score - b.score;
    if (searchState.sort === 'Tiempo') return a.time.localeCompare(b.time);
    return b.score - a.score;
  });
}

export function createTravelOffer(student, route) {
  return {
    driver: student.name,
    route: `${route.origin || 'UNIAJC'} → ${route.destination || 'El Caney'}`,
    seats: 2,
    cost: '2500 COP',
    status: 'Oferta nueva',
    createdAt: new Date().toISOString()
  };
}

export function requestTripSeat(trips = [], index = 0) {
  return trips.map((trip, tripIndex) => {
    if (tripIndex === index && trip.seats > 0) {
      return { ...trip, seats: trip.seats - 1, status: 'Cupo solicitado' };
    }
    return trip;
  });
}

export function calculateTripCost(distanceKm = 8.4) {
  const total = Math.round(Number(distanceKm) * 380 + 1500);
  return {
    totalCop: total,
    formatted: `${total.toLocaleString('es-CO')} COP`,
    premium: `$${total.toLocaleString('es-CO')}`
  };
}

export function createEmergencyAlert(type, studentName) {
  return {
    type,
    detail: `${type} activado por ${studentName}. Contacto de confianza y autoridades notificadas.`,
    state: 'Activo',
    createdAt: new Date().toISOString()
  };
}

export function updateTravelStatus(trips = [], index, status) {
  return trips.map((trip, tripIndex) => tripIndex === index ? { ...trip, status } : trip);
}

export function createChatMessage(sender, text) {
  return {
    sender,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export function buildTravelSearchCandidates() {
  return [
    { name: 'Ana Vélez', zone: 'El Caney', time: '19:45', faculty: 'Ingeniería', transport: 'MIO + caminata', score: 96, safety: 'Alta', gender: 'Mujer' },
    { name: 'Daniela Carmona', zone: 'El Caney', time: '19:50', faculty: 'Ingeniería', transport: 'MIO', score: 92, safety: 'Alta', gender: 'Mujer' },
    { name: 'Santiago Rojas', zone: 'Pance', time: '20:10', faculty: 'Diseño', transport: 'Carro', score: 86, safety: 'Media', gender: 'Hombre' }
  ];
}

export function buildSafetyOverview(student) {
  return {
    panic: false,
    geofence: true,
    emergency: true,
    arrival: false,
    contact: student.emergencyContact || 'Contacto de confianza',
    privacy: student.privacy || 'Zona aproximada'
  };
}

export function buildDashboardSnapshot(trips = [], alerts = []) {
  return {
    upcomingTrips: trips.length,
    activeNotifications: alerts.length,
    activeTrips: Math.max(1, Math.ceil(trips.length / 2)),
    rating: '4.8',
    trustScore: 96
  };
}

export function buildMatchRecommendations(student, candidates = []) {
  return candidates.map((candidate) => ({
    traveler: candidate.name,
    score: calculateCompatibilityScore(student, candidate),
    zone: candidate.zone,
    time: candidate.time,
    mode: candidate.transport,
    recommendation: `Coincidencia ${calculateCompatibilityScore(student, candidate)}% por zona, horario y confianza.`
  }));
}

export function computeReputationScore(reviews = []) {
  if (!reviews.length) return 4.8;
  const total = reviews.reduce((sum, review) => sum + Number(review.score || 0), 0);
  return Number((total / reviews.length).toFixed(1));
}

export function rateUser(user, score) {
  const existing = Number(user.rating || 4.7);
  const next = Number(((existing + Number(score)) / 2).toFixed(1));
  return { ...user, rating: next, trustScore: next };
}

export function reportUser(user, reason) {
  return {
    ...user,
    reported: true,
    reason,
    status: 'En revisión',
    moderationLevel: 'Media'
  };
}

export function generateNotification(type, message, channel) {
  return { type, message, channel, active: true, timestamp: new Date().toISOString() };
}

export function createTripGroup(student, route) {
  return {
    id: `group-${Date.now()}`,
    driver: student.name,
    route: `${route.origin || 'UNIAJC'} → ${route.destination || 'El Caney'}`,
    members: [student.name],
    risk: 'Baja',
    status: 'Grupo creado'
  };
}

export function getUserSummary(student) {
  return {
    name: student.name,
    university: student.university,
    career: student.career,
    semester: student.semester,
    safetyLevel: 'Alta',
    verified: student.verified,
    rating: student.trustScore || 4.8
  };
}

export function challengeRequiredActions() {
  return [
    'registrarUsuarioReal()',
    'validarCorreoInstitucionalReal()',
    'crearPerfilEstudiante()',
    'guardarUbicacionActual()',
    'buscarViajesPorZona()',
    'calcularPuntajeCoincidencia()',
    'crearOfertaViaje()',
    'activarBotonPanico()',
    'enviarAlertaContacto()',
    'enviarMensaje()',
    'obtenerCalificacionUsuario()'
  ];
}
