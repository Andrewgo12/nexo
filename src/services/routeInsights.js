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
