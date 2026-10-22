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
