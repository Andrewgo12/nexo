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
    zone: '',
    time: '',
    faculty: '',
    university: 'Cualquiera',
    transport: 'Cualquiera',
    sort: 'Compatibilidad'
  },
  notifications: [
    { title: 'Recordatorio de salida (demo)', channel: 'En la app', active: false },
    { title: 'Check-in de llegada', channel: 'En la app', active: false },
    { title: 'Cambio de ruta', channel: 'No configurado', active: false },
    { title: 'Contacto de confianza (no conectado)', channel: 'No configurado', active: false }
  ],
  advancedMode: { night: true, safeties: true, hotspots: true, recommendations: true },
  safetyState: { panic: false, geofence: false, emergency: false, arrival: false },
  pricing: { premium: '$4.800', coverage: '98.3%', insured: true, claim: 0 },
  executionState: [
    { id: 'domain-validation', label: 'Validar dominio universitario y perfil del estudiante', done: true },
    { id: 'route-fallback', label: 'Calcular ruta principal con fallback a OpenStreetMap/OSRM', done: true },
    { id: 'search-filter', label: 'Buscar viajes por zona, horario y facultad con filtros', done: true },
    { id: 'match-score', label: 'Asignar puntaje de compatibilidad por zona, ruta y confianza', done: true },
    { id: 'trip-management', label: 'Crear oferta, aceptar pasajero y cerrar trayecto', done: true },
    { id: 'safety-alerts', label: 'Completar seguimiento seguro y conectar alertas externas', done: false },
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
    delete parsed.adminState;
    const savedExecutionState = Array.isArray(parsed.executionState)
      ? parsed.executionState
      : DEFAULT_APP_DATA.executionState;
    const safetyTask = DEFAULT_APP_DATA.executionState.find((task) => task.id === 'safety-alerts');
    return {
      ...DEFAULT_APP_DATA,
      ...parsed,
      student: { ...DEFAULT_APP_DATA.student, ...(parsed.student || {}) },
      university: { ...DEFAULT_APP_DATA.university, ...(parsed.university || {}) },
      route: { ...DEFAULT_APP_DATA.route, ...(parsed.route || {}) },
      searchState: { ...DEFAULT_APP_DATA.searchState, ...(parsed.searchState || {}) },
      notifications: (Array.isArray(parsed.notifications) ? parsed.notifications : DEFAULT_APP_DATA.notifications)
        .map((item) => ['SMS', 'WhatsApp'].includes(item?.channel)
          ? { ...item, title: 'Notificación externa no configurada', channel: 'No configurado', active: false }
          : item),
      advancedMode: { ...DEFAULT_APP_DATA.advancedMode, ...(parsed.advancedMode || {}) },
      safetyState: {
        ...DEFAULT_APP_DATA.safetyState,
        ...(parsed.safetyState || {}),
        geofence: false,
        emergency: false
      },
      pricing: { ...DEFAULT_APP_DATA.pricing, ...(parsed.pricing || {}) },
      executionState: savedExecutionState.map((task) => task?.id === 'safety-alerts'
        ? { ...task, ...safetyTask, done: false }
        : task)
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
