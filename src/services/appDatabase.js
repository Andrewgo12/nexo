const STORAGE_KEY = 'viajau-local-db-v1';

export const DEFAULT_APP_DATA = {
  student: {
    name: 'Kevin González',
    email: 'kevin.gonzalez@uniajc.edu.co',
    career: 'Ingeniería de Sistemas',
    semester: '8vo Semestre',
    shift: 'Nocturna',
    neighborhood: 'El Caney',
    transport: 'MIO + caminata',
    emergency: 'María González',
    privacy: 'Zona aproximada'
  },
  university: {
    id: 'uniajc',
    name: 'UNIAJC',
    domain: '@uniajc.edu.co'
  },
  email: 'kevin.gonzalez@uniajc.edu.co',
  privacy: 'Zona aproximada',
  route: {
    origin: 'UNIAJC Sede Sur',
    destination: 'El Caney',
    mode: 'MIO + caminata',
    time: '9:45 PM'
  },
  searchState: {
    zone: 'El Caney',
    time: '19:45',
    faculty: 'Ingeniería',
    transport: 'MIO',
    confidence: '4.8+',
    gender: 'Cualquiera',
    sort: 'Compatibilidad'
  },
  notifications: [
    { title: 'Salida en 15 min', channel: 'Push', active: true },
    { title: 'Check-in de llegada pendiente', channel: 'SMS', active: true },
    { title: 'Cambio de ruta detectado', channel: 'Alerta', active: false },
    { title: 'Contacto de confianza notificado', channel: 'WhatsApp', active: true }
  ],
  advancedMode: { night: true, safeties: true, hotspots: true, recommendations: true },
  safetyState: { panic: false, geofence: true, emergency: true, arrival: false },
  adminState: { users: '18.4K', trips: '2.1K', matchRate: '89%', safeTrips: '96%' },
  pricing: { premium: '$4.800', coverage: '98.3%', insured: true, claim: 0 },
  executionState: [
    { id: 'domain-validation', label: 'Validar dominio universitario y perfil del estudiante', done: true },
    { id: 'route-fallback', label: 'Calcular ruta principal con fallback a OpenStreetMap/OSRM', done: true },
    { id: 'search-filter', label: 'Buscar viajes por zona, horario y facultad con filtros', done: true },
    { id: 'match-score', label: 'Asignar puntaje de compatibilidad por zona, ruta y confianza', done: true },
    { id: 'trip-management', label: 'Crear oferta, aceptar pasajero y cerrar trayecto', done: true },
    { id: 'safety-alerts', label: 'Mantener geocerca, botones de emergencia y alertas de llegada', done: true },
    { id: 'payment-coverage', label: 'Cobrar por trayecto y activar seguro con cobertura', done: true },
    { id: 'analytics-ops', label: 'Monitorear métricas, logs y salud del sistema', done: false },
    { id: 'backend-sync', label: 'Sincronizar GTFS y caché de rutas en backend real', done: false },
    { id: 'prod-hardening', label: 'Cuarentena de producción, auditoría y escalamiento', done: false }
  ],
  activeTab: 'auth'
};

export function readAppData() {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_DATA;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_APP_DATA;
    }

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_APP_DATA,
      ...parsed,
      student: { ...DEFAULT_APP_DATA.student, ...(parsed.student || {}) },
      university: { ...DEFAULT_APP_DATA.university, ...(parsed.university || {}) },
      route: { ...DEFAULT_APP_DATA.route, ...(parsed.route || {}) },
      searchState: { ...DEFAULT_APP_DATA.searchState, ...(parsed.searchState || {}) },
      notifications: parsed.notifications || DEFAULT_APP_DATA.notifications,
      advancedMode: { ...DEFAULT_APP_DATA.advancedMode, ...(parsed.advancedMode || {}) },
      safetyState: { ...DEFAULT_APP_DATA.safetyState, ...(parsed.safetyState || {}) },
      adminState: { ...DEFAULT_APP_DATA.adminState, ...(parsed.adminState || {}) },
      pricing: { ...DEFAULT_APP_DATA.pricing, ...(parsed.pricing || {}) },
      executionState: parsed.executionState || DEFAULT_APP_DATA.executionState
    };
  } catch {
    return DEFAULT_APP_DATA;
  }
}

export function writeAppData(payload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function resetAppData() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_APP_DATA;
}
