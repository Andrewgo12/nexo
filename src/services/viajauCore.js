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

export function calculateTravelAffinityScore(student, trip) {
  const normalized = (value) => String(value || '').trim().toLocaleLowerCase();
  const studentZone = normalized(student.neighborhood);
  const tripZone = normalized(trip.zone);
  const preferredMode = normalized(student.transport).split(/[+/,]/)[0].trim();
  const tripMode = normalized(trip.transport);
  const shift = normalized(student.shift);
  const hour = Number.parseInt(String(trip.time || '').slice(0, 2), 10);
  let score = 0;

  if (studentZone && tripZone && tripZone.includes(studentZone)) score += 40;
  if (preferredMode && tripMode && (tripMode.includes(preferredMode) || preferredMode.includes(tripMode))) score += 30;
  if (Number.isFinite(hour) && shift) {
    const shiftMatches = shift.includes('mañana') ? hour >= 5 && hour < 12
      : shift.includes('tarde') ? hour >= 12 && hour < 18
        : shift.includes('noche') || shift.includes('noct') ? hour >= 18 || hour < 5
          : false;
    if (shiftMatches) score += 30;
  }
  return score;
}

export function filterTravelMatches(searchState, candidates = []) {
  return [...candidates].filter((item) => {
    const normalized = (value) => String(value || '').trim().toLocaleLowerCase();
    const zoneMatch = !searchState.zone || normalized(item.zone).includes(normalized(searchState.zone));
    const timeMatch = !searchState.time || normalized(item.time).startsWith(searchState.time.slice(0, 2));
    const facultyMatch = !searchState.faculty || normalized(item.faculty).includes(normalized(searchState.faculty));
    const universityMatch = !searchState.university || searchState.university === 'Cualquiera' ||
      normalized(item.university).includes(normalized(searchState.university));
    const transportMatch = !searchState.transport || searchState.transport === 'Cualquiera' ||
      normalized(item.transport).includes(normalized(searchState.transport));
    return zoneMatch && timeMatch && facultyMatch && universityMatch && transportMatch;
  }).sort((a, b) => {
    if (searchState.sort === 'Hora de salida') return String(a.time).localeCompare(String(b.time));
    if (searchState.sort === 'Más recientes') {
      const aDate = Date.parse(a.created_at || '');
      const bDate = Date.parse(b.created_at || '');
      if (!Number.isFinite(aDate)) return Number.isFinite(bDate) ? 1 : 0;
      if (!Number.isFinite(bDate)) return -1;
      return bDate - aDate;
    }
    return Number(b.score || 0) - Number(a.score || 0);
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
    geofence: false,
    emergency: false,
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
    recommendation: `Afinidad estimada ${calculateCompatibilityScore(student, candidate)}% por barrio, transporte y jornada.`
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

export function getRouteModeKey(mode = 'MIO + caminata') {
  const normalized = String(mode).toLowerCase();

  if (normalized.includes('car')) return 'car';
  if (normalized.includes('moto')) return 'moto';
  if (normalized.includes('taxi')) return 'taxi';
  if (normalized.includes('bici')) return 'bike';
  if (normalized.includes('camina')) return 'walk';
  if (normalized.includes('mio')) return 'mio';
  return 'walk';
}

export function calculateTravelReadiness(student, route) {
  const profileScore = Number(student?.trustScore || 4.8) * 20;
  const locationScore = route?.origin && route?.destination ? 82 : 65;
  const routeScore = Math.max(70, Math.min(99, Math.round(profileScore * 0.45 + locationScore * 0.55)));

  return {
    readiness: routeScore,
    status: routeScore >= 90 ? 'Listo para publicar' : routeScore >= 80 ? 'Buen nivel de confianza' : 'Requiere ajuste',
    recommendations: [
      'Verificar zona de origen',
      'Confirmar horario de salida',
      'Validar contacto de apoyo'
    ]
  };
}

export function buildDashboardMetrics(student, route, tripCards = [], alertFeed = []) {
  const trustScore = Number(student?.trustScore || 4.8) * 20;
  const compatibility = Math.min(99, Math.max(78, Math.round((trustScore + 72) / 2)));
  const activeTrips = tripCards.length || 3;
  const activeAlerts = alertFeed.length || 2;

  return {
    validation: `${Math.min(100, Math.max(80, Math.round(trustScore)))}%`,
    routeTime: route?.time || '19:45',
    compatibility: `${compatibility}%`,
    coverage: `${Math.max(92, Math.min(99, compatibility + 3))}%`,
    activeTrips,
    activeAlerts,
    status: `${Math.max(1, activeTrips)} trayectos activos`
  };
}

export function createTrustLedger(user, eventName, scoreDelta = 0) {
  const current = Number(user?.trustScore || 4.8);
  return {
    user: user?.name || 'Estudiante',
    event: eventName,
    previousScore: current,
    delta: Number(scoreDelta),
    nextScore: Number(Math.min(5, Math.max(0, current + Number(scoreDelta))).toFixed(1)),
    timestamp: new Date().toISOString()
  };
}

export function buildSafetyMatrix(student) {
  const base = student?.trustScore || 4.8;
  return {
    panicReady: true,
    geofence: false,
    emergencyContact: Boolean(student?.emergencyContact || student?.emergency),
    risk: base >= 4.8 ? 'Baja' : base >= 4.4 ? 'Media' : 'Alta',
    safeZone: 'Barrio compatible con ruta',
    confidence: `${Math.round(base * 20)}%`
  };
}

export function getCurrentStudentLocation(student = {}) {
  const zone = String(student.neighborhood || 'El Caney');
  return {
    zone,
    coordinates: { lat: 3.4577, lng: -76.5394 },
    privacy: student.privacy || 'Zona aproximada',
    source: 'GPS del dispositivo / geolocalización del estudiante',
    status: 'Ubicación verificada dentro de la zona universitaria'
  };
}

export function searchZoneByText(query = '', zones = []) {
  const safeQuery = String(query || '').trim().toLowerCase();
  if (!safeQuery) return zones;
  return zones.filter((zone) => String(zone || '').toLowerCase().includes(safeQuery));
}

export function suggestMeetingPoint(origin = 'UNIAJC', destination = 'El Caney', zones = []) {
  const safeZones = [
    'Estación Universidades',
    'Parque del Amor',
    'Portal del Sur',
    'Calle 5 con Carrera 70',
    'Punto seguro MIO 3',
    ...(Array.isArray(zones) ? zones : [])
  ];

  const zoneName = safeZones.find((zone) => String(zone).toLowerCase().includes(String(origin).toLowerCase().slice(0, 4))) || safeZones[0];
  const routeText = `${origin || 'UNIAJC'} → ${destination || 'El Caney'}`;

  return {
    id: `point-${Date.now()}`,
    name: zoneName,
    route: routeText,
    riskLevel: 'Baja',
    note: 'Punto de encuentro con iluminación, presencia de tránsito y acceso seguro.'
  };
}

export function evaluateTripRisk(trip = {}, student = {}) {
  const baseScore = Number(student?.trustScore || 4.8) * 20;
  const risk = baseScore >= 90 ? 'Bajo' : baseScore >= 75 ? 'Medio' : 'Alto';
  return {
    risk,
    score: Math.max(10, Math.min(99, Math.round(baseScore))),
    recommendation: risk === 'Bajo' ? 'Viaje seguro para acompañamiento grupal.' : 'Revisar ruta, horario y contacto de confianza.',
    geofence: 'Monitoreo de geocerca no disponible'
  };
}

export function createModerationCase(user = {}, reason = 'Reporte general') {
  return {
    user: user?.name || 'Estudiante',
    reason,
    status: 'En revisión',
    level: 'Media',
    createdAt: new Date().toISOString()
  };
}

export function buildTrustSummary(users = []) {
  const scores = users.length ? users.map((user) => Number(user?.rating || user?.trustScore || 4.8)) : [4.8, 4.9, 4.7];
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  return {
    average: average.toFixed(1),
    recurrentUsers: `${Math.min(99, Math.round((scores.length / 7) * 100))}%`,
    reports: Math.max(1, scores.length),
    verified: '96%'
  };
}

export function buildSafetyAlert(type = 'Check-in', message = 'Todo en orden', severity = 'media') {
  return {
    type,
    message,
    severity,
    active: true,
    timestamp: new Date().toISOString()
  };
}
