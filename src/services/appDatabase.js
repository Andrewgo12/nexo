const STORAGE_KEY = 'viajau-local-db-v1';

export const DEFAULT_APP_DATA = {
  notifications: [
    { title: 'Recordatorio de salida (demo)', channel: 'En la app', active: false },
    { title: 'Check-in de llegada', channel: 'En la app', active: false },
    { title: 'Cambio de ruta', channel: 'No configurado', active: false },
    { title: 'Contacto de confianza (no conectado)', channel: 'No configurado', active: false }
  ],
  advancedMode: { night: true, safeties: true, hotspots: true, recommendations: true },
  safetyState: { panic: false, geofence: false, emergency: false, arrival: false },
  executionState: [
    { id: 'domain-validation', label: 'Validar dominio universitario y perfil del estudiante', done: true },
    { id: 'route-fallback', label: 'Calcular ruta principal con fallback a OpenStreetMap/OSRM', done: true },
    { id: 'search-filter', label: 'Buscar viajes por zona, horario y facultad con filtros', done: true },
    { id: 'match-score', label: 'Asignar puntaje de compatibilidad por zona, ruta y confianza', done: true },
    { id: 'trip-management', label: 'Crear oferta, aceptar pasajero y cerrar trayecto', done: true },
    { id: 'safety-alerts', label: 'Completar seguimiento seguro y conectar alertas externas', done: false },
    { id: 'payment-coverage', label: 'Procesar pagos y confirmar cobertura de seguro', done: false },
    { id: 'analytics-ops', label: 'Monitorear métricas, logs y salud del sistema', done: false },
    { id: 'backend-sync', label: 'Sincronizar GTFS y caché de rutas en backend real', done: false },
    { id: 'prod-hardening', label: 'Cuarentena de producción, auditoría y escalamiento', done: false }
  ],
  activeTab: 'auth'
};

function safeAppData(payload = {}) {
  const data = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const savedExecutionState = Array.isArray(data.executionState) ? data.executionState : [];
  const savedExecutionStateById = new Map(savedExecutionState
    .filter((task) => task && typeof task.id === 'string')
    .map((task) => [task.id, task.done]));

  return {
    activeTab: typeof data.activeTab === 'string' ? data.activeTab : DEFAULT_APP_DATA.activeTab,
    notifications: DEFAULT_APP_DATA.notifications.map((notification, index) => ({
      ...notification,
      active: typeof data.notifications?.[index]?.active === 'boolean'
        ? data.notifications[index].active
        : notification.active
    })),
    advancedMode: Object.fromEntries(
      Object.keys(DEFAULT_APP_DATA.advancedMode).map((key) => [
        key,
        typeof data.advancedMode?.[key] === 'boolean'
          ? data.advancedMode[key]
          : DEFAULT_APP_DATA.advancedMode[key]
      ])
    ),
    executionState: DEFAULT_APP_DATA.executionState.map((task) => ({
      ...task,
      done: typeof savedExecutionStateById.get(task.id) === 'boolean'
        ? savedExecutionStateById.get(task.id)
        : task.done
    }))
  };
}

export function readAppData() {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_DATA;
  }

  let raw;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('No fue posible leer las preferencias guardadas en este navegador.', error);
    return DEFAULT_APP_DATA;
  }

  if (!raw) return DEFAULT_APP_DATA;

  try {
    return { ...DEFAULT_APP_DATA, ...safeAppData(JSON.parse(raw)) };
  } catch (error) {
    console.error('Las preferencias guardadas no tienen un formato válido.', error);
    return DEFAULT_APP_DATA;
  }
}

export function writeAppData(payload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeAppData(payload)));
}

export function resetAppData() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_APP_DATA;
}
