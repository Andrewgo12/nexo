import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOsrmRoute, searchAddressNominatim } from './services/routingApi';
import { getMioRoute } from './services/mioRoutingApi';
import { getCurrentDeviceLocation } from './services/locationApi';
import RouteMap from './components/RouteMap';
import { readAppData, writeAppData } from './services/appDatabase';
import {
  clearAuthToken,
  changePassword,
  getAuthToken,
  getCurrentAccount,
  getTravelMatches,
  getTravelOffers,
  getAdminDashboard,
  getAdminUsers,
  updateAdminUser,
  getAdminIncidents,
  getInstitutionalCatalog,
  createInstitutionalCatalogEntry,
  deactivateInstitutionalCatalogEntry,
  importTransitFeed,
  getLatestTransitFeed,
  getMyReputation,
  getAdminReports,
  getMyMembership,
  createWompiMembershipCheckout,
  getInsuranceProducts,
  getMyInsuranceEnrollments,
  requestInsuranceQuote,
  submitInsurancePolicy,
  getAdminInsuranceEnrollments,
  updateAdminInsuranceEnrollment,
  downloadAdminInsurancePolicy,
  submitTripReview,
  submitTripReport,
  moderateAdminReport,
  getMyTrips,
  getCommunicationTrips,
  getTripMessages,
  sendTripMessage,
  createTripCheckIn,
  publishTravelOffer,
  requestTravelSeat,
  updateTravelRequest,
  updateTravelOfferStatus,
  shareTripLocation,
  stopSharingTripLocation,
  getTripSafetyStatus,
  createSafetyAlert,
  getSafetyAlerts,
  resolveSafetyAlert,
  loginAccount,
  logoutAccount,
  requestPasswordReset,
  resendVerification,
  registerAccount,
  resetPassword,
  updateCurrentProfile,
  uploadProfilePhoto,
} from './services/authApi';
import {
  validateInstitutionalEmail,
  filterTravelMatches,
  calculateTripCost,
  calculateTravelAffinityScore,
  buildRouteSummary,
  buildTravelSearchCandidates,
  buildSafetyOverview,
  buildDashboardSnapshot,
  buildMatchRecommendations,
  calculateTravelReadiness,
  buildDashboardMetrics,
  buildSafetyMatrix,
  getRouteModeKey
} from './services/viajauCore';

const modules = [
  { key: 'auth', title: '1. Usuarios y validación institucional', color: '#34d399' },
  { key: 'routes', title: '2. Mapa, rutas y geolocalización', color: '#60a5fa' },
  { key: 'search', title: '3. Búsqueda, filtros y ordenamiento', color: '#7dd3fc' },
  { key: 'match', title: '4. Match por zona y horario', color: '#a7f3d0' },
  { key: 'trips', title: '5. Gestión de viajes', color: '#fbbf24' },
  { key: 'safety', title: '6. Seguridad y ubicación', color: '#fca5a5' },
  { key: 'admin', title: '7. Administración y analytics', color: '#c4b5fd' },
  { key: 'trust', title: '8. Confiabilidad y reputación', color: '#a78bfa' },
  { key: 'payments', title: '9. Pago y seguro por trayecto', color: '#2dd4bf' },
  { key: 'dashboard', title: '10. Dashboard y comunicación', color: '#f472b6' },
  { key: 'privacy', title: '11. Privacidad y seguridad backend', color: '#38bdf8' },
  { key: 'alerts', title: '12. Notificaciones y recordatorios', color: '#f59e0b' },
  { key: 'advanced', title: '13. Funcionalidades avanzadas', color: '#a3e635' },
  { key: 'backend', title: '14. Infraestructura y backend', color: '#fb7185' },
  { key: 'checklist', title: '15. Checklist de cumplimiento', color: '#f9a8d4' },
  { key: 'roadmap', title: '16. Roadmap de implementación', color: '#67e8f9' },
];

const tripStatusLabels = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  'oferta-activa': 'Activa',
  'en-curso': 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const universities = [
  { id: 'uniajc', name: 'UNIAJC', domain: '@uniajc.edu.co' },
  { id: 'univalle', name: 'Univalle', domain: '@correounivalle.edu.co' },
  { id: 'javeriana', name: 'Javeriana Cali', domain: '@javerianacali.edu.co' },
  { id: 'icesi', name: 'Icesi', domain: '@icesi.edu.co' }
];

const authFns = [
  'registrarUsuario()', 'validarCorreoInstitucional()', 'confirmarDominioUniversitario()', 'verificarIdentidad()', 'crearPerfilEstudiante()',
  'actualizarPerfil()', 'guardarBarrioResidencia()', 'guardarCoordenadasZona()', 'seleccionarFacultadPrograma()', 'seleccionarJornadaAcademica()',
  'definirModoTransporteHabitual()', 'definirHorariosDeSalida()', 'definirContactoDeConfianza()', 'guardarPreferenciasViaje()',
  'activarCompartirUbicación()', 'definirNivelDePrivacidad()', 'activarNotificacionesSeguridad()', 'configurarEmergencia()'
];

const searchFns = [
  'buscarViajesPorZona()', 'buscarViajesPorHora()', 'buscarViajesPorUniversidad()', 'buscarViajesPorFacultad()',
  'filtrarPorTransporte()', 'filtrarPorVerificacionInstitucional()',
  'ordenarPorCompatibilidad()', 'ordenarPorHora()', 'ordenarPorFecha()'
];

const routingApis = ['OSRM', 'Nominatim', 'OpenStreetMap', 'OpenTripPlanner', 'Fallback routing'];

const matchFns = [
  'consultarOfertasVerificadas()', 'compararZonaDeclarada()', 'compararJornadaConHora()',
  'compararTransportePreferido()', 'explicarPuntajeCoincidencia()', 'ordenarRecomendaciones()'
];

const adminChecklist = [
  { id: '7.1', label: 'Consultar métricas reales con alcance por rol', done: true },
  { id: '7.2', label: 'Consultar agregados por universidad, barrio y jornada', done: true },
  { id: '7.3', label: 'Exportar métricas agregadas sin datos personales', done: true },
  { id: '7.4', label: 'Limitar el panel institucional a su propia universidad', done: true },
  { id: '7.5', label: 'Gestionar cuentas estudiantiles y verificación de perfiles', done: true },
  { id: '7.6', label: 'Consultar y filtrar incidentes de seguridad', done: true },
  { id: '7.7', label: 'Administrar sedes, facultades, programas y periodos', done: true },
  { id: '7.8', label: 'Importar y validar paradas y rutas de un feed GTFS', done: true },
];
const adminUniversities = ['UNIAJC', 'Univalle', 'Javeriana Cali', 'Icesi'];
const catalogTypes = [
  { value: 'campus', label: 'Sede' },
  { value: 'faculty', label: 'Facultad' },
  { value: 'program', label: 'Programa' },
  { value: 'period', label: 'Periodo académico' },
];

const privacyFns = [
  'cifrarDatosSensibles()', 'protegerJWT()', 'validarToken()', 'gestionarSesiones()', 'limitarIntentosLogin()', 'auditoriaAcciones()', 'generarLogsSeguridad()',
  'ocultarUbicacionExacta()', 'compartirSoloZona()', 'activarModoPrivacidad()', 'limitarAccesoDeContacto()', 'borrarDatosSolicitados()'
];

const alertFns = [
  'recordatorioViajeProximo()', 'recordatorioCheckIn()', 'recordatorioLlegada()', 'recordatorioSeguro()', 'alertaHoraSalida()',
  'alertaCambioRuta()', 'alertaViajeCancelado()', 'alertaContactoDeConfianza()', 'notificarNuevoMatch()', 'notificarCambioHorario()',
  'notificarLlegada()', 'notificarCancelacion()', 'enviarAlertaSeguridad()', 'enviarPush()', 'enviarCorreo()', 'enviarWhatsAppoSMS()'
];

const advancedFns = [
  'activarModoNocturno()', 'sugerirRutasMasSeguras()', 'priorizarTrayectosNocturnos()', 'recomendarMejorHorario()', 'detectarPatronesDeViaje()',
  'sugerirUnionesFrecuentes()', 'sugerirPuntosSeguros()', 'mostrarZonaDeRiesgo()', 'mostrarPuntosSeguros()', 'mostrarRutasFrecuentes()',
  'mostrarHotspotsDeViaje()', 'subirDatosEstudiantes()', 'sincronizarHorarios()', 'integrarCalendario()', 'validarJornadaAcademica()'
];

const backendFns = [
  'createStudent()', 'updateStudentProfile()', 'validateInstitutionalEmail()', 'findTravelMatches()', 'createTravelOffer()', 'joinTravel()',
  'approveTravelParticipant()', 'startTrip()', 'trackLiveLocation()', 'sendEmergencyAlert()', 'completeTrip()', 'rateUser()', 'reportUser()',
  'processTripPayment()', 'activateTripInsurance()', 'generateTripSummary()', 'generateAnalytics()', 'moderateReports()',
  'fetchRoadNetwork()', 'fetchGTFSStops()', 'fetchRouteLines()', 'buildRouteGraph()', 'detectNearestStop()', 'getTravelTimeByMode()',
  'estimateRouteCost()', 'findMeetingPoint()', 'matchRouteToCampus()', 'mapStudentZoneToRoute()', 'computeInsurancePremium()',
  'activateInsuranceFlow()', 'verifyEligibleTrip()', 'saveInsurancePolicy()', 'monitorTripCoverage()', 'triggerCoverageAlert()', 'issueClaim()',
  'generateInsuranceReport()', 'cacheRouteData()', 'syncTransitData()', 'retryFailedRequest()', 'handleQueueNotifications()', 'monitorSystemHealth()',
  'archiveOldTrips()', 'purgeExpiredSessions()', 'backupDatabase()', 'exportAnalytics()', 'createSystemLogs()'
];

const completionAreas = [
  { label: 'Usuarios y validación', progress: 100, status: 'Completado', items: 'Registro, perfil, correo institucional, privacidad, seguridad' },
  { label: 'Mapas, rutas y búsqueda', progress: 100, status: 'Completado', items: 'Geolocalización, routing, filtros, ordenamiento y matching' },
  { label: 'Gestión de viajes y seguridad', progress: 70, status: 'Parcial', items: 'Ofertas, SOS, GPS consentido, geocercas y avisos opt-in; falta integración con servicios de emergencia' },
  { label: 'Pago, confianza y monetización', progress: 55, status: 'Parcial', items: 'Reputación implementada; cotización y revisión manual de pólizas; pagos y activación automática pendientes' },
  { label: 'Infraestructura avanzada', progress: 92, status: 'Listo para producción', items: 'Logs, cache, sincronización GTFS, auditoría y monitoreo' },
];

const roadmapPhases = [
  { phase: 'Fase 1 - MVP', title: 'Validación + matching + seguridad', detail: 'Permitir registro institucional, afinidad por zona/horario, recomendaciones y geolocalización segura.', status: 'Activo' },
  { phase: 'Fase 2 - Operación', title: 'Viajes + pagos + notificaciones', detail: 'Publicación de viajes, cobro por trayecto, recordatorios y seguimiento de llegada.', status: 'Siguiente' },
  { phase: 'Fase 3 - Crecimiento', title: 'Confianza + analytics + administración', detail: 'Reputación, reportes, panel administrativo y métricas de negocio.', status: 'Planeado' },
  { phase: 'Fase 4 - Escala', title: 'Integraciones reales y backend productivo', detail: 'GTFS real, mapas externos, persistencia, colas, observabilidad y seguridad de producción.', status: 'Futuro' },
];

const executionChecklist = [
  { id: 'domain-validation', label: 'Validar dominio universitario y perfil del estudiante', done: true },
  { id: 'route-fallback', label: 'Calcular ruta vial con OSRM y mostrar errores sin inventar recorridos', done: true },
  { id: 'search-filter', label: 'Buscar viajes por zona, horario, universidad y carrera', done: true },
  { id: 'match-score', label: 'Calcular coincidencias explicables por zona, jornada y transporte', done: true },
  { id: 'trip-management', label: 'Crear oferta, aceptar pasajero y cerrar trayecto', done: true },
  { id: 'safety-alerts', label: 'Compartir ubicación en vivo y atender alertas de emergencia', done: false },
  { id: 'payment-coverage', label: 'Procesar pagos y confirmar cobertura de seguro', done: false },
  { id: 'analytics-ops', label: 'Monitorear métricas, logs y salud del sistema', done: false },
  { id: 'backend-sync', label: 'Sincronizar GTFS y caché de rutas en backend real', done: false },
  { id: 'prod-hardening', label: 'Cuarentena de producción, auditoría y escalamiento', done: false },
];

const dashboardChecklist = [
  { label: 'Resumen de ofertas, viajes, solicitudes y reputación con datos reales', done: true },
  { label: 'Historial de ofertas y participaciones registradas', done: true },
  { label: 'Chat persistente entre responsable y pasajeros aceptados', done: true },
  { label: 'Cerrar el chat para nuevos mensajes al terminar el viaje', done: true },
  { label: 'Fecha del viaje para calcular próximos trayectos', done: false },
  { label: 'Notificaciones push y comunicación externa', done: false },
  { label: 'Compartir ubicación/ruta desde el chat', done: false },
];

const initialStudent = { name: '', email: '', career: '', semester: '', shift: '', neighborhood: '', transport: '', emergency: '', privacy: 'Zona aproximada' };

const kpis = [
  ['Usuarios registrados', '18.4K'], ['Viajes activos', '2.1K'], ['Tasa de coincidencia', '89%'], ['Viajes seguros', '96%']
];

const overviewCards = [
  { key: 'validacion', title: 'Validación institucional', value: '100%', detail: 'Correo universitario validado', tone: '#34d399' },
  { key: 'ruta', title: 'Ruta más segura', value: '18 min', detail: 'UNIAJC → El Caney', tone: '#60a5fa' },
  { key: 'compatibilidad', title: 'Compatibilidad media', value: '92%', detail: 'Coincidencia con zona y horario', tone: '#a7f3d0' },
  { key: 'seguridad', title: 'Seguridad del viaje', value: 'GPS optativo', detail: 'Ubicación y check-in durante viajes activos', tone: '#fca5a5' }
];

const field = { padding: '12px 14px', borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', color: '#fff' };
let wompiWidgetScriptPromise;

function loadWompiWidget() {
  if (window.WidgetCheckout) return Promise.resolve();
  if (!wompiWidgetScriptPromise) {
    wompiWidgetScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        wompiWidgetScriptPromise = null;
        reject(new Error('No fue posible cargar el checkout sandbox de Wompi.'));
      };
      document.head.appendChild(script);
    });
  }
  return wompiWidgetScriptPromise;
}

const insuranceStatusLabel = (status) => ({
  quote_requested: 'Cotización solicitada · pendiente de respuesta',
  quoted: 'Cotización recibida · pendiente de compra externa',
  pending_review: 'Póliza recibida · pendiente de validación',
  active: 'Activa · póliza verificada por administración',
  rejected: 'Rechazada · revisa la nota administrativa',
}[status] || status);
const membershipPaymentStatusLabel = (status) => ({
  pending: 'pendiente de confirmación',
  approved: 'aprobada por sandbox',
  declined: 'rechazada por sandbox',
  voided: 'anulada por sandbox',
  error: 'error de sandbox',
}[status] || status);
const formatInsurancePremium = (amount) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(amount);
export default function AppFresh() {
  const persisted = useMemo(() => readAppData(), []);
  const [active, setActive] = useState(persisted.activeTab || 'auth');
  const [student, setStudent] = useState(initialStudent);
  const [uni, setUni] = useState(universities[0]);
  const [email, setEmail] = useState('');
  const [privacy, setPrivacy] = useState(persisted.privacy || 'Zona aproximada');
  const [toast, setToast] = useState('');
  const [route, setRoute] = useState({ origin: '', destination: '', mode: 'MIO + caminata', time: '' });
  const [searchState, setSearchState] = useState({
    zone: '',
    time: '',
    faculty: '',
    university: 'Cualquiera',
    transport: 'Cualquiera',
    sort: 'Compatibilidad',
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [searchTruncated, setSearchTruncated] = useState(false);
  const [matchResults, setMatchResults] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [matchLoaded, setMatchLoaded] = useState(false);
  const [matchProfileAvailable, setMatchProfileAvailable] = useState(true);
  const [matchTruncated, setMatchTruncated] = useState(false);
  const [myTripData, setMyTripData] = useState({ offers: [], requests: [] });
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState('');
  const [tripActionLoading, setTripActionLoading] = useState('');
  const [tripRefreshKey, setTripRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState(persisted.notifications || [
    { title: 'Recordatorio de salida (demo)', channel: 'En la app', active: false },
    { title: 'Check-in de llegada', channel: 'En la app', active: false },
    { title: 'Cambio de ruta', channel: 'No configurado', active: false },
    { title: 'Contacto de confianza (no conectado)', channel: 'No configurado', active: false },
  ]);
  const [advancedMode, setAdvancedMode] = useState(persisted.advancedMode || { night: true, safeties: true, hotspots: true, recommendations: true });
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminDashboardLoading, setAdminDashboardLoading] = useState(false);
  const [adminDashboardError, setAdminDashboardError] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserMeta, setAdminUserMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [adminIncidents, setAdminIncidents] = useState([]);
  const [adminIncidentMeta, setAdminIncidentMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [adminIncidentPage, setAdminIncidentPage] = useState(1);
  const [adminIncidentStatus, setAdminIncidentStatus] = useState('all');
  const [adminCatalog, setAdminCatalog] = useState([]);
  const [adminSelectedUniversity, setAdminSelectedUniversity] = useState('');
  const [adminCatalogForm, setAdminCatalogForm] = useState({ type: 'campus', name: '' });
  const [adminUserFilters, setAdminUserFilters] = useState({ status: '', verification: '', search: '' });
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminStopsFile, setAdminStopsFile] = useState(null);
  const [adminRoutesFile, setAdminRoutesFile] = useState(null);
  const [adminFeedVersion, setAdminFeedVersion] = useState('');
  const [adminLatestFeed, setAdminLatestFeed] = useState(null);
  const [adminManagementLoading, setAdminManagementLoading] = useState(false);
  const [adminManagementAction, setAdminManagementAction] = useState('');
  const [adminManagementError, setAdminManagementError] = useState('');
  const [adminManagementRefresh, setAdminManagementRefresh] = useState(0);
  const [reputationData, setReputationData] = useState(null);
  const [reputationLoading, setReputationLoading] = useState(false);
  const [reputationError, setReputationError] = useState('');
  const [reputationAction, setReputationAction] = useState('');
  const [reputationRefresh, setReputationRefresh] = useState(0);
  const [adminReports, setAdminReports] = useState([]);
  const [adminReportsMeta, setAdminReportsMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [adminReportsPage, setAdminReportsPage] = useState(1);
  const [insuranceProducts, setInsuranceProducts] = useState([]);
  const [myInsuranceEnrollments, setMyInsuranceEnrollments] = useState([]);
  const [adminInsuranceEnrollments, setAdminInsuranceEnrollments] = useState([]);
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [insuranceError, setInsuranceError] = useState('');
  const [insuranceAction, setInsuranceAction] = useState('');
  const [insuranceRefresh, setInsuranceRefresh] = useState(0);
  const [dashboardTrips, setDashboardTrips] = useState({ offers: [], requests: [] });
  const [dashboardConversations, setDashboardConversations] = useState([]);
  const [dashboardReputation, setDashboardReputation] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [selectedChatTripId, setSelectedChatTripId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatReadOnly, setChatReadOnly] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatAction, setChatAction] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [reviewForm, setReviewForm] = useState({ trip_id: '', reviewee_profile_id: '', rating: '5', comment: '' });
  const [reportForm, setReportForm] = useState({ trip_id: '', reported_profile_id: '', category: 'conduct', description: '' });
  const [executionState, setExecutionState] = useState(persisted.executionState || executionChecklist);
  const [routeResult, setRouteResult] = useState(null);
  const [routeLocations, setRouteLocations] = useState({ origin: null, destination: null });
  const [routeSearchResults, setRouteSearchResults] = useState({ origin: [], destination: [] });
  const [routeSearchLoading, setRouteSearchLoading] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [tripCards, setTripCards] = useState([]);
  const [tripOfferForm, setTripOfferForm] = useState({
    origin: 'UNIAJC Sede Sur',
    destination: 'El Caney',
    departure_time: '19:45',
    mode: 'MIO + caminata',
    seats: '2',
    cost: '2500 COP',
    safety_route_duration_minutes: '45',
  });
  const [tripGeofenceConsent, setTripGeofenceConsent] = useState(false);
  const [tripGeofencePreview, setTripGeofencePreview] = useState(null);
  const [alertFeed, setAlertFeed] = useState([]);
  const [safetyActionLoading, setSafetyActionLoading] = useState('');
  const [safetyError, setSafetyError] = useState('');
  const [safetyLocationError, setSafetyLocationError] = useState('');
  const [includeSafetyLocation, setIncludeSafetyLocation] = useState(false);
  const [safetyRefreshKey, setSafetyRefreshKey] = useState(0);
  const [safetyAlertsLoading, setSafetyAlertsLoading] = useState(false);
  const [safetyTripData, setSafetyTripData] = useState({ offers: [], requests: [] });
  const [selectedSafetyTripId, setSelectedSafetyTripId] = useState('');
  const [tripSafetyStatus, setTripSafetyStatus] = useState({ locations: [], check_ins: [], safety_events: [] });
  const [sharingTripLocation, setSharingTripLocation] = useState(false);
  const tripLocationUpdateRef = useRef(Promise.resolve());
  const [modal, setModal] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const resetParams = new URLSearchParams(window.location.search);
  const [authMode, setAuthMode] = useState(resetParams.has('reset_token') ? 'reset' : 'login');
  const [loginForm, setLoginForm] = useState({
    name: '',
    email: resetParams.get('email') || '',
    password: '',
    password_confirmation: '',
    career: '',
    semester: '',
    shift: '',
    neighborhood: '',
    emergency_contact: '',
    remember: false,
  });
  const [profilePhoto, setProfilePhoto] = useState('KG');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);

  const validEmail = useMemo(() => validateInstitutionalEmail(email, uni.domain), [email, uni]);
  const insuranceMonthlyBudget = insuranceProducts[0]?.monthly_budget_cop ?? 30000;
  const safetyTripOptions = useMemo(() => [
    ...safetyTripData.offers
      .filter((trip) => trip.status === 'en-curso')
      .map((trip) => ({ id: trip.id, label: `${trip.origin} → ${trip.destination} (responsable)` })),
    ...safetyTripData.requests
      .filter((request) => request.status === 'accepted' && request.offer.status === 'en-curso')
      .map((request) => ({
        id: request.offer.id,
        label: `${request.offer.origin} → ${request.offer.destination} (${request.offer.owner})`,
      })),
  ], [safetyTripData]);
  const geofenceRouteFingerprint = JSON.stringify([
    tripOfferForm.origin,
    tripOfferForm.destination,
    tripOfferForm.mode,
    tripOfferForm.safety_route_duration_minutes,
  ]);
  const hasCurrentGeofencePreview = tripGeofencePreview?.fingerprint === geofenceRouteFingerprint;

  const readiness = useMemo(() => calculateTravelReadiness(student, route), [student, route]);
  const dashboardMetrics = useMemo(() => buildDashboardMetrics(student, route, tripCards, alertFeed), [student, route, tripCards, alertFeed]);
  const safetyMatrix = useMemo(() => buildSafetyMatrix(student), [student]);

  const applyAuthenticatedUser = useCallback((user) => {
    setAuthUser(user);
    const matchingUniversity = universities.find((item) => item.name === user.university);
    if (matchingUniversity) setUni(matchingUniversity);
    setStudent((current) => ({
      ...current,
      name: user.name,
      email: user.email,
      career: user.career || '',
      semester: user.semester || '',
      shift: user.shift || '',
      neighborhood: user.neighborhood || '',
      emergency: user.emergency_contact || '',
      trusted_contact_email: user.trusted_contact_email || '',
      trusted_contact_phone: user.trusted_contact_phone || '',
      trusted_contact_consent: Boolean(user.trusted_contact_consent),
    }));
    setEmail(user.email);
    setIsEmailVerified(Boolean(user.email_verified_at));
    if (user.role === 'security') setActive('safety');
    else if (!['admin', 'university'].includes(user.role)) setActive('auth');
  }, []);

  const searchFilters = useMemo(() => ({
    zone: searchState.zone,
    time: searchState.time,
    faculty: searchState.faculty,
    university: searchState.university,
    transport: searchState.transport,
  }), [
    searchState.faculty,
    searchState.time,
    searchState.transport,
    searchState.university,
    searchState.zone,
  ]);

  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      if (new URLSearchParams(window.location.search).get('verified') === '1') {
        setToast('Correo institucional verificado. Ya puedes iniciar sesión.');
      }
      clearAuthToken();
      try {
        const { user } = await getCurrentAccount();
        if (!cancelled) {
          applyAuthenticatedUser(user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        if (!cancelled && error.status !== 401) setToast(error.message);
      }
      if (!cancelled) setIsBooting(false);
    };
    restoreSession();
    return () => { cancelled = true; };
  }, [applyAuthenticatedUser]);

  useEffect(() => {
    writeAppData({
      notifications,
      advancedMode,
      executionState,
      activeTab: active
    });
  }, [notifications, advancedMode, executionState, active]);

  useEffect(() => {
    const canViewAdminDashboard = active === 'admin'
      && isLoggedIn
      && isEmailVerified
      && ['admin', 'university'].includes(authUser?.role);
    if (!canViewAdminDashboard) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const loadDashboard = async () => {
      setAdminDashboardLoading(true);
      setAdminDashboardError('');
      try {
        const response = await getAdminDashboard(getAuthToken(), controller.signal);
        if (!response.stats || !response.distribution) {
          throw new Error('El servidor devolvió métricas administrativas inválidas.');
        }
        if (!cancelled) setAdminDashboard(response);
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setAdminDashboard(null);
          setAdminDashboardError(error.message || 'No fue posible cargar las métricas administrativas.');
        }
      } finally {
        if (!cancelled) setAdminDashboardLoading(false);
      }
    };
    loadDashboard();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, authUser?.role, isEmailVerified, isLoggedIn]);

  useEffect(() => {
    if (authUser?.role === 'university' && authUser.university) {
      setAdminSelectedUniversity(authUser.university);
    }
  }, [authUser?.role, authUser?.university]);

  useEffect(() => {
    if (
      active !== 'admin'
      || !isLoggedIn
      || !isEmailVerified
      || !['admin', 'university'].includes(authUser?.role)
    ) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const loadAdminManagement = async () => {
      setAdminManagementLoading(true);
      setAdminManagementError('');
      try {
        const [usersResponse, incidentsResponse, catalogResponse] = await Promise.all([
          getAdminUsers(adminUserFilters, getAuthToken(), controller.signal),
          getAdminIncidents(adminIncidentStatus, getAuthToken(), controller.signal, adminIncidentPage),
          authUser?.role === 'university' || adminSelectedUniversity
            ? getInstitutionalCatalog(
              authUser?.role === 'university' ? undefined : adminSelectedUniversity,
              getAuthToken(),
              controller.signal,
            )
            : Promise.resolve({ data: [] }),
        ]);
        if (!Array.isArray(usersResponse.data) || !Array.isArray(incidentsResponse.data) || !Array.isArray(catalogResponse.data)) {
          throw new Error('El servidor devolvió datos administrativos inválidos.');
        }
        if (!cancelled) {
          setAdminUsers(usersResponse.data);
          setAdminUserMeta(usersResponse.meta);
          setAdminIncidents(incidentsResponse.data);
          setAdminIncidentMeta(incidentsResponse.meta);
          setAdminCatalog(catalogResponse.data);
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setAdminManagementError(error.message || 'No fue posible cargar la gestión administrativa.');
        }
      } finally {
        if (!cancelled) setAdminManagementLoading(false);
      }
    };
    loadAdminManagement();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    active,
    adminManagementRefresh,
    adminIncidentStatus,
    adminIncidentPage,
    adminSelectedUniversity,
    adminUserFilters,
    authUser?.role,
    isEmailVerified,
    isLoggedIn,
  ]);

  useEffect(() => {
    if (active !== 'trust' || !isLoggedIn || !isEmailVerified) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const loadReputation = async () => {
      setReputationLoading(true);
      setReputationError('');
      try {
        const [reputationResponse, reportsResponse] = await Promise.all([
          authUser?.role === 'student'
            ? getMyReputation(getAuthToken(), controller.signal)
            : Promise.resolve({ data: null }),
          authUser?.role === 'admin'
            ? getAdminReports('open', getAuthToken(), controller.signal, adminReportsPage)
            : Promise.resolve({ data: [] }),
        ]);
        if (!cancelled) {
          setReputationData(reputationResponse.data);
          setAdminReports(reportsResponse.data);
          setAdminReportsMeta(reportsResponse.meta || { current_page: 1, last_page: 1, total: reportsResponse.data.length });
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setReputationError(error.message || 'No fue posible cargar la reputación y los reportes.');
        }
      } finally {
        if (!cancelled) setReputationLoading(false);
      }
    };
    loadReputation();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, adminReportsPage, authUser?.role, isEmailVerified, isLoggedIn, reputationRefresh]);

  useEffect(() => {
    if (active !== 'payments' || !isLoggedIn || !isEmailVerified) return undefined;
    if (!['student', 'admin'].includes(authUser?.role)) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const loadInsurance = async () => {
      setInsuranceLoading(true);
      setInsuranceError('');
      try {
        const [productsResponse, studentResponse, membershipResponse, adminResponse] = await Promise.all([
          getInsuranceProducts(getAuthToken(), controller.signal),
          authUser?.role === 'student'
            ? getMyInsuranceEnrollments(getAuthToken(), controller.signal)
            : Promise.resolve({ data: [] }),
          authUser?.role === 'student'
            ? getMyMembership(getAuthToken(), controller.signal)
            : Promise.resolve({ data: null }),
          authUser?.role === 'admin'
            ? getAdminInsuranceEnrollments(getAuthToken(), controller.signal)
            : Promise.resolve({ data: [] }),
        ]);
        if (!cancelled) {
          setInsuranceProducts(productsResponse.data || []);
          setMyInsuranceEnrollments(studentResponse.data || []);
          setMembershipInfo(membershipResponse);
          setAdminInsuranceEnrollments(authUser?.role === 'admin' ? adminResponse.data || [] : []);
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setInsuranceError(error.message || 'No fue posible cargar las cotizaciones de seguro.');
        }
      } finally {
        if (!cancelled) setInsuranceLoading(false);
      }
    };
    loadInsurance();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, authUser?.role, insuranceRefresh, isEmailVerified, isLoggedIn]);

  useEffect(() => {
    if (active !== 'dashboard' || !isLoggedIn || !isEmailVerified || authUser?.role !== 'student') return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError('');
      try {
        const [tripsResponse, conversationsResponse, reputationResponse] = await Promise.all([
          getMyTrips(getAuthToken(), controller.signal),
          getCommunicationTrips(getAuthToken(), controller.signal),
          getMyReputation(getAuthToken(), controller.signal),
        ]);
        if (!Array.isArray(tripsResponse.data?.offers)
          || !Array.isArray(tripsResponse.data?.requests)
          || !Array.isArray(conversationsResponse.data)) {
          throw new Error('El servidor devolvió información de dashboard inválida.');
        }
        if (!cancelled) {
          setDashboardTrips(tripsResponse.data);
          setDashboardConversations(conversationsResponse.data);
          setDashboardReputation(reputationResponse.data || null);
          setSelectedChatTripId((current) => (
            conversationsResponse.data.some((trip) => String(trip.id) === current)
              ? current
              : String(conversationsResponse.data[0]?.id || '')
          ));
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setDashboardError(error.message || 'No fue posible cargar tu dashboard.');
        }
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };
    loadDashboard();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, authUser?.role, isEmailVerified, isLoggedIn, tripRefreshKey]);

  useEffect(() => {
    if (active !== 'dashboard' || !selectedChatTripId || !isLoggedIn || !isEmailVerified) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const loadChat = async () => {
      try {
        const response = await getTripMessages(selectedChatTripId, getAuthToken(), controller.signal);
        if (!Array.isArray(response.data)) throw new Error('El servidor devolvió mensajes inválidos.');
        if (!cancelled) {
          setChatMessages(response.data);
          setChatReadOnly(Boolean(response.meta?.read_only));
          setChatError('');
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setChatMessages([]);
          setChatError(error.message || 'No fue posible cargar el chat de este viaje.');
        }
      }
    };
    setChatLoading(true);
    loadChat().finally(() => {
      if (!cancelled) setChatLoading(false);
    });
    const intervalId = window.setInterval(loadChat, 12000);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [active, isEmailVerified, isLoggedIn, selectedChatTripId]);

  useEffect(() => {
    if (active !== 'admin' || authUser?.role !== 'admin' || !isLoggedIn || !isEmailVerified) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    getLatestTransitFeed(getAuthToken(), controller.signal)
      .then((response) => {
        if (!cancelled) setAdminLatestFeed(response.data || null);
      })
      .catch((error) => {
        if (!cancelled && error.name !== 'AbortError') {
          setAdminManagementError(error.message || 'No fue posible consultar el último feed GTFS.');
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, adminManagementRefresh, authUser?.role, isEmailVerified, isLoggedIn]);

  useEffect(() => {
    if (active !== 'search' || !isLoggedIn || !isEmailVerified) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');
      setSearchLoaded(false);
      try {
        const response = await getTravelOffers(searchFilters, getAuthToken(), controller.signal);
        if (!Array.isArray(response.data)) {
          throw new Error('El servidor devolvió una lista de ofertas inválida.');
        }
        if (!cancelled) {
          setSearchResults(response.data);
          setSearchLoaded(true);
          setSearchTruncated(Boolean(response.meta?.truncated));
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setSearchResults([]);
          setSearchTruncated(false);
          setSearchError(error.message || 'No fue posible buscar ofertas de viaje.');
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    active,
    isEmailVerified,
    isLoggedIn,
    searchFilters,
  ]);

  useEffect(() => {
    if (active !== 'match' || !isLoggedIn || !isEmailVerified) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setMatchLoading(true);
      setMatchError('');
      setMatchLoaded(false);
      try {
        const response = await getTravelMatches(getAuthToken(), controller.signal);
        if (!Array.isArray(response.data)) {
          throw new Error('El servidor devolvió una lista de coincidencias inválida.');
        }
        if (!cancelled) {
          setMatchResults(response.data);
          setMatchProfileAvailable(response.meta?.profile_available !== false);
          setMatchTruncated(Boolean(response.meta?.truncated));
          setMatchLoaded(true);
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setMatchResults([]);
          setMatchTruncated(false);
          setMatchError(error.message || 'No fue posible calcular coincidencias de viaje.');
        }
      } finally {
        if (!cancelled) setMatchLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [active, isEmailVerified, isLoggedIn]);

  useEffect(() => {
    if (
      active !== 'safety'
      || !isLoggedIn
      || !isEmailVerified
      || !['admin', 'security'].includes(authUser?.role)
    ) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const loadAlerts = async () => {
      setSafetyAlertsLoading(true);
      setSafetyError('');
      try {
        const response = await getSafetyAlerts(getAuthToken(), controller.signal);
        if (!Array.isArray(response.data)) {
          throw new Error('El servidor devolvió una lista de alertas inválida.');
        }
        if (!cancelled) setAlertFeed(response.data);
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setAlertFeed([]);
          setSafetyError(error.message || 'No fue posible cargar las alertas de seguridad.');
        }
      } finally {
        if (!cancelled) setSafetyAlertsLoading(false);
      }
    };
    loadAlerts();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, authUser?.role, isEmailVerified, isLoggedIn, safetyRefreshKey]);

  useEffect(() => {
    if (active !== 'safety' || !isLoggedIn || !isEmailVerified || authUser?.role !== 'student') {
      setSafetyTripData({ offers: [], requests: [] });
      setSelectedSafetyTripId('');
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;
    const loadSafetyTrips = async () => {
      try {
        const response = await getMyTrips(getAuthToken(), controller.signal);
        if (!Array.isArray(response.data?.offers) || !Array.isArray(response.data?.requests)) {
          throw new Error('El servidor devolvió viajes activos inválidos.');
        }
        if (!cancelled) setSafetyTripData(response.data);
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setSafetyTripData({ offers: [], requests: [] });
          setSafetyError(error.message || 'No fue posible cargar tus viajes activos.');
        }
      }
    };
    loadSafetyTrips();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, authUser?.role, isEmailVerified, isLoggedIn, tripRefreshKey]);

  useEffect(() => {
    if (!safetyTripOptions.some((trip) => String(trip.id) === String(selectedSafetyTripId))) {
      setSelectedSafetyTripId(safetyTripOptions[0] ? String(safetyTripOptions[0].id) : '');
    }
  }, [safetyTripOptions, selectedSafetyTripId]);

  useEffect(() => {
    setSharingTripLocation(false);
    setTripSafetyStatus({ locations: [], check_ins: [], safety_events: [] });
  }, [selectedSafetyTripId]);

  useEffect(() => {
    if (active === 'safety' || !sharingTripLocation || !selectedSafetyTripId) return undefined;

    setSharingTripLocation(false);
    const stopSharing = async () => {
      try {
        await tripLocationUpdateRef.current;
      } catch (error) {
        setSafetyError(error.message || 'No fue posible actualizar la ubicación antes de detenerla.');
      }
      try {
        await stopSharingTripLocation(selectedSafetyTripId);
        setSafetyRefreshKey((current) => current + 1);
      } catch (error) {
        setSafetyError(error.message || 'No fue posible retirar tu ubicación del viaje.');
      }
    };
    stopSharing();

    return undefined;
  }, [active, selectedSafetyTripId, sharingTripLocation]);

  useEffect(() => {
    if (active !== 'safety' || !isLoggedIn || !isEmailVerified || !selectedSafetyTripId) {
      setTripSafetyStatus({ locations: [], check_ins: [], safety_events: [] });
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;
    let loading = false;
    const loadTripSafetyStatus = async () => {
      if (loading) return;
      loading = true;
      try {
        const response = await getTripSafetyStatus(selectedSafetyTripId, getAuthToken(), controller.signal);
        if (
          !Array.isArray(response.data?.locations)
          || !Array.isArray(response.data?.check_ins)
          || !Array.isArray(response.data?.safety_events)
        ) {
          throw new Error('El servidor devolvió el estado de seguridad del viaje inválido.');
        }
        if (!cancelled) setTripSafetyStatus(response.data);
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setTripSafetyStatus({ locations: [], check_ins: [], safety_events: [] });
          setSafetyError(error.message || 'No fue posible consultar el viaje activo.');
        }
      } finally {
        loading = false;
      }
    };
    loadTripSafetyStatus();
    const intervalId = window.setInterval(loadTripSafetyStatus, 15000);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [active, isEmailVerified, isLoggedIn, safetyRefreshKey, selectedSafetyTripId]);

  useEffect(() => {
    if (active !== 'safety' || !isLoggedIn || !isEmailVerified || !selectedSafetyTripId || !sharingTripLocation) {
      return undefined;
    }

    let cancelled = false;
    let updating = false;
    const updateLocation = async () => {
      if (cancelled || updating) return;
      updating = true;
      const update = (async () => {
        try {
          const location = await getCurrentDeviceLocation();
          if (cancelled) return;
          await shareTripLocation(selectedSafetyTripId, {
            latitude: location.lat,
            longitude: location.lng,
            ...(location.accuracy !== null && location.accuracy <= 100000
              ? { accuracy_meters: Math.round(location.accuracy) }
              : {}),
          });
          if (!cancelled) setSafetyError('');
        } catch (error) {
          if (!cancelled) {
            setSharingTripLocation(false);
            setSafetyError(error.message || 'No fue posible actualizar tu ubicación compartida.');
          }
        }
      })();
      tripLocationUpdateRef.current = update;
      try {
        await update;
      } finally {
        updating = false;
      }
    };
    updateLocation();
    const intervalId = window.setInterval(updateLocation, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [active, isEmailVerified, isLoggedIn, selectedSafetyTripId, sharingTripLocation]);

  useEffect(() => {
    if (active !== 'trips' || !isLoggedIn || !isEmailVerified) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    const loadTrips = async () => {
      setTripLoading(true);
      setTripError('');
      try {
        const token = getAuthToken();
        const [offersResponse, myTripsResponse] = await Promise.all([
          getTravelOffers({}, token, controller.signal),
          getMyTrips(token, controller.signal),
        ]);
        if (!Array.isArray(offersResponse.data) || !Array.isArray(myTripsResponse.data?.offers) || !Array.isArray(myTripsResponse.data?.requests)) {
          throw new Error('El servidor devolvió datos de viajes inválidos.');
        }
        if (!cancelled) {
          setTripCards(offersResponse.data);
          setMyTripData(myTripsResponse.data);
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setTripCards([]);
          setMyTripData({ offers: [], requests: [] });
          setTripError(error.message || 'No fue posible cargar la gestión de viajes.');
        }
      } finally {
        if (!cancelled) setTripLoading(false);
      }
    };
    loadTrips();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, isEmailVerified, isLoggedIn, tripRefreshKey]);

  const summary = useMemo(() => {
    if (routeResult) {
      const routeSummary = buildRouteSummary({ origin: route.origin, destination: route.destination, mode: route.mode, routeResult });
      return {
        ...routeSummary,
        duration: Number.isFinite(routeResult.durationMin) ? routeSummary.duration : 'Horario no disponible',
      };
    }
    return { duration: 'Pendiente', distance: 'Pendiente', safety: 'No evaluado' };
  }, [route, routeResult]);

  const searchCandidates = useMemo(() => searchResults.map((offer) => ({
    ...offer,
    score: calculateTravelAffinityScore(student, offer),
  })), [searchResults, student]);
  const filteredResults = useMemo(() => filterTravelMatches(searchState, searchCandidates), [searchCandidates, searchState]);

  const saveProfile = async () => {
    try {
      const { user, message } = await updateCurrentProfile({
        name: student.name,
        career: student.career,
        semester: student.semester,
        shift: student.shift,
        neighborhood: student.neighborhood,
        transport: student.transport,
        emergency_contact: student.emergency,
        trusted_contact_consent: Boolean(student.trusted_contact_consent),
        trusted_contact_email: student.trusted_contact_consent ? student.trusted_contact_email : null,
        trusted_contact_phone: student.trusted_contact_consent ? student.trusted_contact_phone : null,
        privacy,
      });
      applyAuthenticatedUser(user);
      setToast(message);
    } catch (error) {
      setToast(error.message);
    }
  };

  const hasAdminDashboardAccess = isLoggedIn
    && isEmailVerified
    && ['admin', 'university'].includes(authUser?.role);
  const currentAdminDashboard = hasAdminDashboardAccess && (
    adminDashboard?.scope?.global
      ? authUser?.role === 'admin'
      : authUser?.role === 'university'
        && adminDashboard?.scope?.university === (authUser?.university || null)
  ) ? adminDashboard : null;

  const refreshAdminManagement = () => setAdminManagementRefresh((value) => value + 1);

  const saveAdminUser = async (user, changes) => {
    setAdminManagementAction(`user-${user.id}`);
    setAdminManagementError('');
    try {
      await updateAdminUser(user.id, changes);
      refreshAdminManagement();
      setToast('Cuenta estudiantil actualizada.');
    } catch (error) {
      setAdminManagementError(error.message || 'No fue posible actualizar la cuenta.');
    } finally {
      setAdminManagementAction('');
    }
  };

  const createAdminCatalogEntry = async (event) => {
    event.preventDefault();
    setAdminManagementAction('catalog');
    setAdminManagementError('');
    try {
      await createInstitutionalCatalogEntry({
        ...(authUser?.role === 'admin' ? { university: adminSelectedUniversity } : {}),
        ...adminCatalogForm,
      });
      setAdminCatalogForm((current) => ({ ...current, name: '' }));
      refreshAdminManagement();
      setToast('Elemento del catálogo institucional creado.');
    } catch (error) {
      setAdminManagementError(error.message || 'No fue posible crear el elemento.');
    } finally {
      setAdminManagementAction('');
    }
  };

  const deactivateAdminCatalogEntry = async (entry) => {
    setAdminManagementAction(`catalog-${entry.id}`);
    setAdminManagementError('');
    try {
      await deactivateInstitutionalCatalogEntry(entry.id);
      refreshAdminManagement();
      setToast('Elemento del catálogo desactivado.');
    } catch (error) {
      setAdminManagementError(error.message || 'No fue posible desactivar el elemento.');
    } finally {
      setAdminManagementAction('');
    }
  };

  const submitAdminTransitFeed = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!adminStopsFile || !adminRoutesFile) {
      setAdminManagementError('Selecciona stops.txt y routes.txt antes de importar.');
      return;
    }
    setAdminManagementAction('gtfs');
    setAdminManagementError('');
    try {
      const response = await importTransitFeed({
        feed_version: adminFeedVersion,
        stops: adminStopsFile,
        routes: adminRoutesFile,
      });
      setAdminLatestFeed(response.data);
      setAdminStopsFile(null);
      setAdminRoutesFile(null);
      setAdminFeedVersion('');
      form.reset();
      setToast('Feed GTFS validado e importado. La interfaz no afirmará horarios activos.');
    } catch (error) {
      setAdminManagementError(error.message || 'No fue posible importar el feed GTFS.');
    } finally {
      setAdminManagementAction('');
    }
  };

  const submitReputationReview = async (event) => {
    event.preventDefault();
    setReputationAction('review');
    setReputationError('');
    try {
      await submitTripReview(Number(reviewForm.trip_id), {
        reviewee_profile_id: Number(reviewForm.reviewee_profile_id),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviewForm((current) => ({ ...current, comment: '' }));
      setReputationRefresh((value) => value + 1);
      setToast('Valoración verificada registrada.');
    } catch (error) {
      setReputationError(error.message || 'No fue posible enviar la valoración.');
    } finally {
      setReputationAction('');
    }
  };

  const submitReputationReport = async (event) => {
    event.preventDefault();
    setReputationAction('report');
    setReputationError('');
    try {
      await submitTripReport(Number(reportForm.trip_id), {
        reported_profile_id: Number(reportForm.reported_profile_id),
        category: reportForm.category,
        description: reportForm.description,
      });
      setReportForm((current) => ({ ...current, description: '' }));
      setReputationRefresh((value) => value + 1);
      setToast('Reporte enviado de forma privada para revisión.');
    } catch (error) {
      setReputationError(error.message || 'No fue posible enviar el reporte.');
    } finally {
      setReputationAction('');
    }
  };

  const submitInsuranceQuoteRequest = async (productKey) => {
    setInsuranceAction(`quote-${productKey}`);
    setInsuranceError('');
    try {
      await requestInsuranceQuote(productKey);
      setInsuranceRefresh((value) => value + 1);
      setToast('Solicitud de cotización enviada. No se ha activado ninguna cobertura.');
    } catch (error) {
      setInsuranceError(error.message || 'No fue posible solicitar la cotización.');
    } finally {
      setInsuranceAction('');
    }
  };

  const submitDashboardMessage = async (event) => {
    event.preventDefault();
    if (!selectedChatTripId || !chatDraft.trim()) return;
    setChatAction(true);
    setChatError('');
    try {
      const response = await sendTripMessage(Number(selectedChatTripId), chatDraft.trim());
      setChatMessages((current) => [...current, response.data].slice(-100));
      setChatDraft('');
    } catch (error) {
      setChatError(error.message || 'No fue posible enviar el mensaje.');
    } finally {
      setChatAction(false);
    }
  };

  const openWompiMembershipCheckout = async () => {
    setInsuranceAction('membership-checkout');
    setInsuranceError('');
    try {
      const { data: checkout } = await createWompiMembershipCheckout();
      await loadWompiWidget();
      if (typeof window.WidgetCheckout !== 'function') {
        throw new Error('Wompi no cargó el checkout esperado.');
      }
      const widget = new window.WidgetCheckout({
        publicKey: checkout.public_key,
        currency: checkout.currency,
        amountInCents: checkout.amount_in_cents,
        reference: checkout.reference,
        signature: checkout.signature,
        redirectUrl: checkout.redirect_url,
      });
      widget.open(() => {
        setToast('Checkout de pruebas finalizado; el estado solo se actualizará con el webhook validado.');
        setInsuranceRefresh((value) => value + 1);
      });
    } catch (error) {
      setInsuranceError(error.message || 'No fue posible iniciar el checkout sandbox.');
    } finally {
      setInsuranceAction('');
    }
  };

  const submitInsurancePolicyForm = async (event, enrollmentId) => {
    event.preventDefault();
    const form = event.currentTarget;
    setInsuranceAction(`policy-${enrollmentId}`);
    setInsuranceError('');
    try {
      await submitInsurancePolicy(enrollmentId, new FormData(form));
      form.reset();
      setInsuranceRefresh((value) => value + 1);
      setToast('Documento recibido; la póliza aún requiere revisión administrativa.');
    } catch (error) {
      setInsuranceError(error.message || 'No fue posible enviar el documento de póliza.');
    } finally {
      setInsuranceAction('');
    }
  };

  const submitAdminInsuranceQuote = async (event, enrollmentId) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setInsuranceAction(`admin-${enrollmentId}`);
    setInsuranceError('');
    try {
      await updateAdminInsuranceEnrollment(enrollmentId, {
        status: 'quoted',
        monthly_premium_cop: Number(form.get('monthly_premium_cop')),
        coverage_summary: String(form.get('coverage_summary') || '').trim(),
      });
      setInsuranceRefresh((value) => value + 1);
      setToast('Cotización registrada para revisión del estudiante.');
    } catch (error) {
      setInsuranceError(error.message || 'No fue posible registrar la cotización.');
    } finally {
      setInsuranceAction('');
    }
  };

  const moderateInsuranceEnrollment = async (enrollmentId, status) => {
    const reviewNote = status === 'rejected'
      ? window.prompt('Motivo del rechazo (obligatorio):')
      : '';
    if (reviewNote === null) return;
    if (status === 'rejected' && !reviewNote.trim()) {
      setInsuranceError('Escribe el motivo del rechazo para informar al estudiante.');
      return;
    }
    setInsuranceAction(`admin-${enrollmentId}`);
    setInsuranceError('');
    try {
      await updateAdminInsuranceEnrollment(enrollmentId, { status, review_note: reviewNote.trim() });
      setInsuranceRefresh((value) => value + 1);
      setToast(status === 'active' ? 'Póliza validada y activada.' : 'Solicitud de seguro rechazada.');
    } catch (error) {
      setInsuranceError(error.message || 'No fue posible actualizar el estado de la póliza.');
    } finally {
      setInsuranceAction('');
    }
  };

  const downloadInsurancePolicy = async (enrollmentId) => {
    setInsuranceAction(`download-${enrollmentId}`);
    setInsuranceError('');
    try {
      const file = await downloadAdminInsurancePolicy(enrollmentId);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `poliza-${enrollmentId}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setInsuranceError(error.message || 'No fue posible descargar la póliza.');
    } finally {
      setInsuranceAction('');
    }
  };

  const moderateReputationReport = async (reportId, status) => {
    const resolutionNote = window.prompt('Nota de resolución (opcional):');
    if (resolutionNote === null) return;
    setReputationAction(`report-${reportId}`);
    setReputationError('');
    try {
      await moderateAdminReport(reportId, { status, resolution_note: resolutionNote });
      setReputationRefresh((value) => value + 1);
      setToast('Reporte moderado.');
    } catch (error) {
      setReputationError(error.message || 'No fue posible actualizar el reporte.');
    } finally {
      setReputationAction('');
    }
  };

  const exportAdminAnalytics = () => {
    if (!currentAdminDashboard) return;
    const contents = JSON.stringify({
      exported_at: new Date().toISOString(),
      scope: currentAdminDashboard.scope,
      stats: currentAdminDashboard.stats,
      distribution: currentAdminDashboard.distribution,
    }, null, 2);
    const file = new Blob([contents], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `viajau-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setToast('Se descargaron métricas agregadas sin datos personales.');
  };

  const updateSearchFilter = (key, value) => {
    setSearchState((current) => ({ ...current, [key]: value }));
    setSearchLoading(true);
    setSearchError('');
    setSearchLoaded(false);
  };

  const calculateRouteNow = async () => {
    if (!routeLocations.origin || !routeLocations.destination) {
      setRouteError('Busca y selecciona un resultado para el origen y el destino antes de calcular.');
      return;
    }

    const mode = route.mode.toLowerCase().includes('carro') ? 'car'
      : route.mode.toLowerCase().includes('moto') ? 'moto'
        : route.mode.toLowerCase().includes('taxi') ? 'taxi'
          : route.mode.toLowerCase().includes('bici') ? 'bike'
            : route.mode.toLowerCase().includes('caminata') ? 'walk'
            : 'mio';
    setRouteLoading(true);
    setRouteError('');
    try {
      const result = mode === 'mio'
        ? await getMioRoute(routeLocations.origin, routeLocations.destination)
        : await getOsrmRoute(routeLocations.origin, routeLocations.destination, mode);
      const summary = buildRouteSummary({ origin: route.origin, destination: route.destination, mode: route.mode, routeResult: result });
      setRouteResult(result);
      setToast(`Ruta calculada con ${result.source}: ${summary.distance} / ${summary.duration}.`);
    } catch (error) {
      setRouteResult(null);
      setRouteError(error.message || 'No fue posible calcular una ruta real.');
    } finally {
      setRouteLoading(false);
    }
  };

  const searchRouteLocation = async (fieldName) => {
    setRouteSearchLoading(fieldName);
    setRouteError('');
    setRouteSearchResults((current) => ({ ...current, [fieldName]: [] }));
    try {
      const results = await searchAddressNominatim(route[fieldName]);
      setRouteSearchResults((current) => ({ ...current, [fieldName]: results }));
      if (!results.length) setRouteError('No se encontraron lugares. Prueba con otra dirección o un barrio de Cali.');
    } catch (error) {
      setRouteError(error.message || 'No fue posible buscar esa dirección.');
    } finally {
      setRouteSearchLoading('');
    }
  };

  const selectRouteLocation = (fieldName, result) => {
    setRoute((current) => ({ ...current, [fieldName]: result.name }));
    setRouteLocations((current) => ({
      ...current,
      [fieldName]: [result.lat, result.lng],
    }));
    setRouteSearchResults((current) => ({ ...current, [fieldName]: [] }));
    setRouteResult(null);
    setRouteError('');
  };

  const useDeviceLocation = async () => {
    setLocationLoading(true);
    setRouteError('');
    try {
      const location = await getCurrentDeviceLocation();
      const coordinates = [location.lat, location.lng];
      setDeviceLocation(coordinates);
      setRouteLocations((current) => ({ ...current, origin: coordinates }));
      setRoute((current) => ({ ...current, origin: 'Mi ubicación actual' }));
      setRouteSearchResults((current) => ({ ...current, origin: [] }));
      setRouteResult(null);
      setToast(
        location.accuracy
          ? `Ubicación obtenida con precisión aproximada de ${Math.round(location.accuracy)} m. Solo se conserva durante esta sesión.`
          : 'Ubicación obtenida. Solo se conserva durante esta sesión.',
      );
    } catch (error) {
      setRouteError(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const action = (label) => setToast(`${label} ejecutado correctamente. Contacto de confianza y autoridades notificadas.`);
  const toggleNotification = (index) => {
    setNotifications((current) => current.map((item, idx) => idx === index ? { ...item, active: !item.active } : item));
    setToast('Recordatorio actualizado correctamente.');
  };
  const toggleAdvancedFeature = (key) => {
    setAdvancedMode((current) => ({ ...current, [key]: !current[key] }));
    setToast('Configuración de recomendación avanzada actualizada.');
  };
  const toggleExecutionTask = (id) => {
    setExecutionState((current) => current.map((item) => item.id === id ? { ...item, done: !item.done } : item));
    setToast('Estado del checklist actualizado.');
  };
  const calculateTravelCost = () => {
    const { premium } = calculateTripCost(routeResult?.distanceKm ?? 8.4);
    setToast(`Costo estimado actualizado: ${premium} por trayecto.`);
  };
  const runTripAction = async (loadingKey, operation, successMessage) => {
    setTripActionLoading(loadingKey);
    setTripError('');
    try {
      await operation();
      setTripRefreshKey((current) => current + 1);
      setToast(successMessage);
    } catch (error) {
      setTripError(error.message || 'No se pudo actualizar el viaje.');
    } finally {
      setTripActionLoading('');
    }
  };
  const submitTripOffer = async (event) => {
    event.preventDefault();
    setTripActionLoading('create');
    setTripError('');
    try {
      let safetyRoute = {};
      if (tripGeofenceConsent) {
        if (!hasCurrentGeofencePreview) {
          const [origins, destinations] = await Promise.all([
            searchAddressNominatim(tripOfferForm.origin),
            searchAddressNominatim(tripOfferForm.destination),
          ]);
          if (!origins.length || !destinations.length) {
            throw new Error('No se pudo ubicar el origen o destino para configurar la geocerca.');
          }
          const origin = [origins[0].lat, origins[0].lng];
          const destination = [destinations[0].lat, destinations[0].lng];
          const mode = tripOfferForm.mode.toLocaleLowerCase();
          const routeMode = mode.includes('mio')
            ? 'mio'
            : mode.includes('bici')
              ? 'bike'
              : mode.includes('caminata') || mode.includes('pie')
                ? 'walk'
                : mode.includes('moto')
                  ? 'moto'
                  : 'car';
          const route = routeMode === 'mio'
            ? await getMioRoute(origin, destination)
            : await getOsrmRoute(origin, destination, routeMode);
          if (!Array.isArray(route.polyline) || route.polyline.length < 2) {
            throw new Error('El proveedor no devolvió un trazado válido para la geocerca.');
          }
          const polyline = route.polyline.length <= 500
            ? route.polyline
            : Array.from({ length: 500 }, (_, index) => (
              route.polyline[Math.round(index * (route.polyline.length - 1) / 499)]
            ));
          setTripGeofencePreview({
            fingerprint: geofenceRouteFingerprint,
            origin: origins[0].fullName,
            destination: destinations[0].fullName,
            source: route.source,
            polyline,
          });
          setToast('Revisa los resultados geocodificados y confirma la ruta antes de publicar.');
          return;
        }
        safetyRoute = {
          safety_route: tripGeofencePreview.polyline,
          safety_route_duration_minutes: Number(tripOfferForm.safety_route_duration_minutes),
        };
      }
      const { safety_route_duration_minutes: _duration, ...offerFields } = tripOfferForm;
      await publishTravelOffer({
        ...offerFields,
        seats: Number(tripOfferForm.seats),
        ...(tripGeofenceConsent ? safetyRoute : {}),
      });
      setTripRefreshKey((current) => current + 1);
      setToast(tripGeofenceConsent
        ? 'Oferta publicada con geocerca; el trazado se usa para alertas y se elimina al cerrar el viaje. Solo se comparte el evento, no las coordenadas.'
        : 'Oferta de viaje publicada.');
    } catch (error) {
      setTripError(error.message || 'No se pudo publicar la oferta.');
    } finally {
      setTripActionLoading('');
    }
  };
  const stopTripLocationSharing = async (tripId = selectedSafetyTripId) => {
    if (!tripId) return;
    setSharingTripLocation(false);
    setSafetyActionLoading('stop-sharing');
    setSafetyError('');
    try {
      try {
        await tripLocationUpdateRef.current;
      } catch (error) {
        setSafetyError(error.message || 'No fue posible actualizar la ubicación antes de detenerla.');
      }
      await stopSharingTripLocation(tripId);
      setSafetyRefreshKey((current) => current + 1);
      setToast('Tu ubicación fue retirada del viaje.');
    } catch (error) {
      setSafetyError(error.message || 'No fue posible retirar tu ubicación del viaje.');
    } finally {
      setSafetyActionLoading('');
    }
  };
  const startTripLocationSharing = async () => {
    if (!selectedSafetyTripId) return;
    const tripId = selectedSafetyTripId;
    setSafetyActionLoading('share-location');
    setSafetyError('');
    try {
      const location = await getCurrentDeviceLocation();
      if (tripId !== selectedSafetyTripId || active !== 'safety') return;
      await shareTripLocation(tripId, {
        latitude: location.lat,
        longitude: location.lng,
        ...(location.accuracy !== null && location.accuracy <= 100000
          ? { accuracy_meters: Math.round(location.accuracy) }
          : {}),
      });
      setSharingTripLocation(true);
      setSafetyRefreshKey((current) => current + 1);
      setToast('Ubicación compartida con los participantes de este viaje mientras mantengas el seguimiento activo.');
    } catch (error) {
      setSafetyError(error.message || 'No fue posible iniciar el seguimiento de ubicación.');
    } finally {
      setSafetyActionLoading('');
    }
  };
  const recordTripCheckIn = async (type) => {
    if (!selectedSafetyTripId) return;
    setSafetyActionLoading(`check-in-${type}`);
    setSafetyError('');
    try {
      await createTripCheckIn(selectedSafetyTripId, type);
      setSafetyRefreshKey((current) => current + 1);
      setToast(type === 'departure' ? 'Salida confirmada para los participantes del viaje.' : 'Llegada segura registrada para los participantes del viaje.');
    } catch (error) {
      setSafetyError(error.message || 'No fue posible registrar el check-in.');
    } finally {
      setSafetyActionLoading('');
    }
  };
  const activatePanic = async (attachLocation = includeSafetyLocation) => {
    setSafetyActionLoading('panic');
    setSafetyError('');
    try {
      let location = {};
      if (attachLocation) {
        try {
          const currentLocation = await getCurrentDeviceLocation();
          location = {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            ...(currentLocation.accuracy !== null && currentLocation.accuracy <= 100000
              ? { accuracy_meters: Math.round(currentLocation.accuracy) }
              : {}),
          };
          setSafetyLocationError('');
        } catch (error) {
          setSafetyLocationError(error.message || 'No fue posible obtener el GPS.');
          return false;
        }
      }

      const response = await createSafetyAlert(location);
      setAlertFeed((current) => [response.data, ...current]);
      const deliveryStatuses = response.data.notification_deliveries || [];
      const pendingDeliveries = deliveryStatuses.filter((delivery) => delivery.status === 'pending').length;
      const failedDeliveries = deliveryStatuses.filter((delivery) => ['failed', 'skipped'].includes(delivery.status)).length;
      setToast(pendingDeliveries
        ? `SOS registrado. ${pendingDeliveries} aviso(s) a tu contacto quedaron en cola.`
        : failedDeliveries
          ? `SOS registrado, pero ${failedDeliveries} canal(es) de contacto no están configurados o fallaron. El equipo de seguridad puede ver la alerta.`
          : 'SOS registrado para el equipo de seguridad. La notificación externa requiere consentimiento del contacto y configuración de proveedores.');
      return true;
    } catch (error) {
      setSafetyError(error.message || 'No fue posible registrar la alerta de emergencia.');
      throw error;
    } finally {
      setSafetyActionLoading('');
    }
  };
  const confirmEmergency = async (sendWithoutLocation = false) => {
    try {
      const registered = await activatePanic(sendWithoutLocation ? false : includeSafetyLocation);
      if (registered) closeModal();
    } catch {
      setToast('No se pudo registrar el SOS. Revisa el error mostrado en Seguridad.');
    }
  };
  const handleResolveSafetyAlert = async (alertId) => {
    setSafetyActionLoading(`resolve-${alertId}`);
    setSafetyError('');
    try {
      await resolveSafetyAlert(alertId);
      setSafetyRefreshKey((current) => current + 1);
      setToast('Alerta marcada como atendida.');
    } catch (error) {
      setSafetyError(error.message || 'No fue posible actualizar la alerta.');
    } finally {
      setSafetyActionLoading('');
    }
  };

  const completedTasks = executionState.filter((item) => item.done).length;

  const summaryCards = [
    { key: 'validacion', title: 'Validación institucional', value: dashboardMetrics.validation, detail: `Correo ${uni.domain} verificado`, tone: '#34d399' },
    { key: 'ruta', title: 'Ruta más segura', value: summary.duration, detail: `${route.origin} → ${route.destination}`, tone: '#60a5fa' },
    { key: 'compatibilidad', title: 'Compatibilidad media', value: dashboardMetrics.compatibility, detail: `${readiness.status} • ${getRouteModeKey(route.mode)}`, tone: '#a7f3d0' },
    { key: 'seguridad', title: 'Seguimiento activo', value: safetyMatrix.risk, detail: `${safetyMatrix.confidence} de confianza de seguridad`, tone: '#fca5a5' }
  ];

  const openModal = (payload) => setModal(payload);
  const closeModal = () => setModal(null);

  const confirmProfile = () => {
    void saveProfile().then(closeModal);
  };

  const handleChangePassword = async () => {
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setToast('Las contraseñas nuevas no coinciden.');
      return;
    }
    try {
      const response = await changePassword(passwordForm);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setToast(response.message);
    } catch (error) {
      setToast(error.message);
    }
  };

  const handleProfilePhotoUpload = async () => {
    if (!profilePhotoFile) {
      setToast('Selecciona una imagen para subir.');
      return;
    }
    try {
      const { user, message } = await uploadProfilePhoto(profilePhotoFile);
      applyAuthenticatedUser(user);
      setProfilePhotoFile(null);
      setToast(message);
    } catch (error) {
      setToast(error.message);
    }
  };

  const handleAuthSubmit = async () => {
    if (!loginForm.email || !loginForm.password) {
      if (authMode !== 'forgot') {
        setToast('Completa el correo institucional y la contraseña para continuar.');
        return;
      }
    }
    if (authMode === 'forgot') {
      if (!loginForm.email) {
        setToast('Escribe tu correo institucional para enviarte instrucciones.');
        return;
      }
      try {
        const response = await requestPasswordReset(loginForm.email);
        setToast(response.message);
      } catch (error) {
        setToast(error.message);
      }
      return;
    }
    if (authMode === 'register' && !loginForm.name.trim()) {
      setToast('Agrega tu nombre para crear tu perfil universitario.');
      return;
    }
    if (['register', 'reset'].includes(authMode) && loginForm.password !== loginForm.password_confirmation) {
      setToast('Las contraseñas no coinciden.');
      return;
    }

    try {
      if (authMode === 'reset') {
        const response = await resetPassword({
          token: resetParams.get('reset_token'),
          email: loginForm.email,
          password: loginForm.password,
          password_confirmation: loginForm.password_confirmation,
        });
        setToast(response.message);
        setAuthMode('login');
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      const response = authMode === 'register'
        ? await registerAccount({
          name: loginForm.name,
          email: loginForm.email,
          password: loginForm.password,
          password_confirmation: loginForm.password_confirmation,
          university: uni.id,
          career: loginForm.career || undefined,
          semester: loginForm.semester || undefined,
          shift: loginForm.shift || undefined,
          neighborhood: loginForm.neighborhood || undefined,
          emergency_contact: loginForm.emergency_contact || undefined,
        })
        : await loginAccount({
          email: loginForm.email,
          password: loginForm.password,
          remember: loginForm.remember,
        });

      applyAuthenticatedUser(response.user);
      setIsLoggedIn(true);
      setToast(response.message);
    } catch (error) {
      setToast(error.message);
    }
  };

  const handlePasswordRecovery = () => {
    setToast('');
    setAuthMode('forgot');
  };

  const refreshEmailVerification = async () => {
    try {
      const { user } = await getCurrentAccount();
      applyAuthenticatedUser(user);
      setToast(user.email_verified_at ? 'Correo verificado. Tu cuenta ya está activa.' : 'El correo aún no aparece como verificado.');
    } catch (error) {
      setToast(error.message);
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const response = await resendVerification();
      setToast(response.message);
    } catch (error) {
      setToast(error.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020b10', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      {isBooting && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(16,185,129,.12), rgba(2,11,16,.95) 52%)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 92, height: 92, borderRadius: '50%', margin: '0 auto 20px', border: '2px solid rgba(52,211,153,.5)', boxShadow: '0 0 50px rgba(52,211,153,.15)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 900 }}>V</div>
            <div style={{ fontSize: 11, letterSpacing: '0.24em', color: '#86efac', fontWeight: 800, marginBottom: 8 }}>VIAJAU</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Preparando movilidad segura</div>
          </div>
        </div>
      )}

      {!isBooting && !isLoggedIn && (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 980, borderRadius: 28, background: 'linear-gradient(135deg, rgba(15,23,42,.96), rgba(2,11,16,.96))', border: '1px solid rgba(148,163,184,.2)', boxShadow: '0 28px 80px rgba(15,23,42,.5)', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', overflow: 'hidden' }}>
            <div style={{ padding: 40, background: 'linear-gradient(135deg, rgba(16,185,129,.12), rgba(59,130,246,.08), transparent)' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#86efac', fontWeight: 800, marginBottom: 12 }}>VIAJAU</div>
              <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.08 }}>Tu movilidad segura universitaria</h1>
              <p style={{ margin: '18px 0 28px', color: '#dbeafe', fontSize: 16, lineHeight: 1.7 }}>
                Validación institucional, emparejamiento por zona y horario, rutas seguras y notificaciones de seguridad para estudiantes de Cali y alrededores.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                <div style={{ background: 'rgba(15,23,42,.65)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 24, fontWeight: 800, color: '#86efac' }}>96%</div><div style={{ marginTop: 6, color: '#dbeafe', fontSize: 12 }}>Coincidencia segura</div></div>
                <div style={{ background: 'rgba(15,23,42,.65)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 24, fontWeight: 800, color: '#7dd3fc' }}>24/7</div><div style={{ marginTop: 6, color: '#dbeafe', fontSize: 12 }}>Monitoreo</div></div>
                <div style={{ background: 'rgba(15,23,42,.65)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>4.8</div><div style={{ marginTop: 6, color: '#dbeafe', fontSize: 12 }}>Rating promedio</div></div>
              </div>
            </div>

            <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,.9)' }}>
              <div style={{ width: '100%', maxWidth: 360 }}>
                <div style={{ display: 'flex', gap: 8, background: 'rgba(15,23,42,.8)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 6, marginBottom: 20 }}>
                  <button onClick={() => setAuthMode('login')} style={{ flex: 1, border: 'none', background: authMode === 'login' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 800 }}>Ingresar</button>
                  <button onClick={() => setAuthMode('register')} style={{ flex: 1, border: 'none', background: authMode === 'register' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 800 }}>Registrarse</button>
                </div>

                <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 20, padding: 22 }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16 }}>
                    {authMode === 'login' ? 'Acceso a la cuenta' : authMode === 'forgot' ? 'Recuperar cuenta' : authMode === 'reset' ? 'Nueva contraseña' : 'Crear cuenta universitaria'}
                  </div>
                  {toast && <div role="alert" style={{ color: '#fecaca', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>{toast}</div>}

                  {authMode === 'register' && (
                    <>
                      <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                        <span style={{ color: '#dbeafe', fontWeight: 700 }}>Nombre completo</span>
                        <input value={loginForm.name} onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder="Tu nombre" />
                      </label>
                      <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                        <span style={{ color: '#dbeafe', fontWeight: 700 }}>Universidad</span>
                        <select value={uni.id} onChange={(e) => setUni(universities.find((item) => item.id === e.target.value) || universities[0])} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }}>
                          {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
                        </select>
                      </label>
                      {[
                        ['career', 'Carrera', 'Tu carrera'],
                        ['semester', 'Semestre', 'Ej. 8vo semestre'],
                        ['shift', 'Jornada', 'Ej. Nocturna'],
                        ['neighborhood', 'Barrio', 'Tu barrio'],
                        ['emergency_contact', 'Contacto de confianza', 'Nombre del contacto (opcional)'],
                      ].map(([key, label, placeholder]) => (
                        <label key={key} style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                          <span style={{ color: '#dbeafe', fontWeight: 700 }}>{label}</span>
                          <input value={loginForm[key]} onChange={(e) => setLoginForm({ ...loginForm, [key]: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder={placeholder} />
                        </label>
                      ))}
                    </>
                  )}

                  <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                    <span style={{ color: '#dbeafe', fontWeight: 700 }}>Correo institucional</span>
                    <input value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder="usuario@uniajc.edu.co" />
                  </label>

                  {authMode !== 'forgot' && (
                    <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                      <span style={{ color: '#dbeafe', fontWeight: 700 }}>{authMode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}</span>
                      <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder="••••••••" />
                    </label>
                  )}

                  {authMode === 'login' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dbeafe', fontSize: 13 }}>
                        <input type="checkbox" checked={loginForm.remember} onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })} />
                        Recordarme
                      </label>
                      <button type="button" onClick={handlePasswordRecovery} style={{ background: 'transparent', border: 'none', color: '#7dd3fc', fontWeight: 700 }}>Recuperar contraseña</button>
                    </div>
                  )}

                  {['register', 'reset'].includes(authMode) && (
                    <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                      <span style={{ color: '#dbeafe', fontWeight: 700 }}>Confirmar contraseña</span>
                      <input type="password" value={loginForm.password_confirmation} onChange={(e) => setLoginForm({ ...loginForm, password_confirmation: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder="Repite tu contraseña" />
                    </label>
                  )}

                  <button onClick={handleAuthSubmit} style={{ width: '100%', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#052e16', padding: '12px 18px', fontWeight: 900, marginBottom: 10 }}>
                    {authMode === 'login' ? 'Entrar a ViajaU' : authMode === 'forgot' ? 'Enviar instrucciones' : authMode === 'reset' ? 'Actualizar contraseña' : 'Crear perfil universitario'}
                  </button>

                  <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.6 }}>
                    {authMode === 'login' ? '¿No tienes cuenta? Crea tu perfil con tu correo universitario.' : authMode === 'forgot' ? 'Si el correo está registrado, recibirás un enlace para recuperar la cuenta.' : authMode === 'reset' ? 'Usa una contraseña nueva de al menos 12 caracteres, con letras y números.' : 'Usa 12 caracteres o más. Para entrar, también deberás verificar tu correo institucional.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isBooting && isLoggedIn && !isEmailVerified && (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 520, background: 'rgba(15,23,42,.9)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 24, padding: 32 }}>
            <h1 style={{ marginTop: 0 }}>Verifica tu correo institucional</h1>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>Enviamos un enlace a {email}. Verifica el buzón antes de acceder a las funciones de ViajaU.</p>
            {toast && <div role="status" style={{ color: '#a7f3d0', marginBottom: 16 }}>{toast}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={sendVerificationEmail} style={{ ...field, cursor: 'pointer' }}>Reenviar verificación</button>
              <button onClick={refreshEmailVerification} style={{ ...field, cursor: 'pointer' }}>Ya verifiqué mi correo</button>
              <button onClick={async () => {
                try {
                  await logoutAccount();
                  clearAuthToken();
                  setIsLoggedIn(false);
                  setAlertFeed([]);
                  setSafetyError('');
                  setActive('auth');
                } catch (error) {
                  setToast(error.message);
                }
              }} style={{ ...field, cursor: 'pointer' }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {!isBooting && isLoggedIn && isEmailVerified && (
        <>
      <div style={{ borderBottom: '1px solid rgba(148,163,184,.2)', padding: 18, position: 'sticky', top: 0, background: 'rgba(2,11,16,.75)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#86efac', fontWeight: 800 }}>VIAJAU</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Movilidad segura universitaria</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {modules.filter((module) => {
              if (module.key === 'admin') return ['admin', 'university'].includes(authUser?.role);
              if (authUser?.role === 'security') return ['auth', 'safety'].includes(module.key);
              return true;
            }).map((m) => (
              <button key={m.key} onClick={() => setActive(m.key)} style={{ border: active === m.key ? '1px solid rgba(52,211,153,.5)' : '1px solid rgba(148,163,184,.2)', background: active === m.key ? 'rgba(16,185,129,.12)' : 'rgba(10,15,20,.75)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 700, transition: 'all 0.2s ease', transform: active === m.key ? 'translateY(-1px)' : 'none', boxShadow: active === m.key ? '0 8px 24px rgba(16,185,129,0.18)' : 'none' }}>
                {m.title}
              </button>
            ))}
            <button
              onClick={async () => {
                try {
                  await logoutAccount();
                  clearAuthToken();
                  setIsLoggedIn(false);
                  setAlertFeed([]);
                  setSafetyError('');
                  setActive('auth');
                } catch (error) {
                  setToast(error.message);
                }
              }}
              style={{ border: '1px solid rgba(248,113,113,.35)', background: 'rgba(127,29,29,.2)', color: '#fecaca', borderRadius: 10, padding: '10px 12px', fontWeight: 700 }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 60px' }}>
        {toast && <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(52,211,153,.4)', borderRadius: 12, padding: '12px 14px', marginBottom: 18, color: '#d1fae5', animation: 'fadeIn 0.22s ease-out' }}>{toast}</div>}

        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(59,130,246,0.08), rgba(15,23,42,0.9))', border: '1px solid rgba(148,163,184,.18)', borderRadius: 24, padding: 24, marginBottom: 24, boxShadow: '0 22px 40px rgba(2,6,23,0.45)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 20, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{ background: 'rgba(52,211,153,0.14)', color: '#a7f3d0', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>MVP activo</span>
                <span style={{ background: 'rgba(96,165,250,0.12)', color: '#bfdbfe', border: '1px solid rgba(96,165,250,0.28)', borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Seguridad + matching</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 38, lineHeight: 1.1, maxWidth: 700 }}>ViajaU: movilidad segura para estudiantes universitarios</h2>
              <p style={{ marginTop: 12, color: '#dbeafe', fontSize: 15, maxWidth: 660, lineHeight: 1.7 }}>
                Plataforma de viajes compartidos por zona y jornada, con validación universitaria, rutas y alertas SOS registradas para el equipo de seguridad.
              </p>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.62)', border: '1px solid rgba(148,163,184,.22)', borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Estado del sistema</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#dbeafe' }}>Perfil verificado</span>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>{dashboardMetrics.validation}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#dbeafe' }}>Compatibilidad</span>
                  <span style={{ color: '#7dd3fc', fontWeight: 800 }}>{dashboardMetrics.compatibility}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#dbeafe' }}>Riesgo</span>
                  <span style={{ color: '#fca5a5', fontWeight: 800 }}>{safetyMatrix.risk}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, marginBottom: 24 }}>
          {summaryCards.map((card) => (
            <div key={card.key} style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, padding: 18, boxShadow: '0 18px 32px rgba(15,23,42,0.22)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${card.tone}22, transparent)`, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>{card.title}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: card.tone }}>{card.value}</div>
                <div style={{ fontSize: 12, color: '#dbeafe' }}>{card.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {modal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 560, animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Confirmación</div>
                  <h3 style={{ marginTop: 6, fontSize: 28, fontWeight: 800 }}>{modal.title}</h3>
                </div>
                <button className="btn-secondary" style={{ padding: '8px 10px' }} onClick={closeModal}>✕</button>
              </div>

              <div style={{ background: 'rgba(15,23,42,.8)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', display: 'inline-block', background: modal.accent || '#10b981', boxShadow: `0 0 0 6px ${modal.accent || '#10b981'}22` }} />
                  <span style={{ fontWeight: 800, color: '#dbeafe' }}>Acción segura y validada</span>
                </div>
                <p style={{ color: '#dbeafe', lineHeight: 1.6, margin: 0 }}>{modal.message}</p>
              </div>

              {modal.type === 'panic' && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#dbeafe' }}>
                    <input
                      type="checkbox"
                      checked={includeSafetyLocation}
                      onChange={(event) => {
                        setIncludeSafetyLocation(event.target.checked);
                        setSafetyLocationError('');
                      }}
                    />
                    Incluir mi ubicación GPS actual en esta alerta (el navegador solicitará permiso y las coordenadas se enviarán al servidor).
                  </label>
                  {safetyLocationError && (
                    <div role="alert" style={{ color: '#fecaca', marginTop: 10 }}>
                      {safetyLocationError}
                      <button
                        type="button"
                        disabled={safetyActionLoading === 'panic'}
                        onClick={() => void confirmEmergency(true)}
                        style={{ ...field, display: 'block', marginTop: 8, padding: '7px 10px', cursor: 'pointer' }}
                      >
                        Enviar SOS sin ubicación GPS
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
                <button className="btn-primary" disabled={safetyActionLoading === 'panic'} onClick={modal.onConfirm}>
                  {safetyActionLoading === 'panic' ? 'Registrando SOS…' : modal.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {active === 'auth' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#86efac', fontWeight: 800 }}>MÓDULO 1</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Autenticación y registro universitario</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}><span>Universidad</span><select value={uni.id} disabled style={field}>{universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Correo institucional</span><input value={email} readOnly style={{ ...field, borderColor: validEmail ? 'rgba(52,211,153,.5)' : 'rgba(239,68,68,.55)' }} /></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}><span>Nombre</span><input value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Programa / facultad</span><input value={student.career} onChange={(e) => setStudent({ ...student, career: e.target.value })} style={field} /></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}><span>Semestre</span><input value={student.semester} onChange={(e) => setStudent({ ...student, semester: e.target.value })} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Jornada</span><select value={student.shift} onChange={(e) => setStudent({ ...student, shift: e.target.value })} style={field}><option>Mañana</option><option>Nocturna</option><option>Tarde</option></select></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Barrio</span><input value={student.neighborhood} onChange={(e) => setStudent({ ...student, neighborhood: e.target.value })} style={field} /></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}><span>Transporte habitual</span><input value={student.transport} onChange={(e) => setStudent({ ...student, transport: e.target.value })} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Contacto de confianza</span><input value={student.emergency} onChange={(e) => setStudent({ ...student, emergency: e.target.value })} style={field} /></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span>Correo del contacto de confianza</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={student.trusted_contact_email || ''}
                    onChange={(event) => setStudent((current) => ({ ...current, trusted_contact_email: event.target.value }))}
                    disabled={!student.trusted_contact_consent}
                    style={field}
                    placeholder="contacto@ejemplo.com"
                  />
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span>Teléfono del contacto (formato internacional)</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={student.trusted_contact_phone || ''}
                    onChange={(event) => setStudent((current) => ({ ...current, trusted_contact_phone: event.target.value }))}
                    disabled={!student.trusted_contact_consent}
                    style={field}
                    placeholder="+573001234567"
                  />
                </label>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={Boolean(student.trusted_contact_consent)}
                  onChange={(event) => setStudent((current) => ({
                    ...current,
                    trusted_contact_consent: event.target.checked,
                    ...(event.target.checked ? {} : { trusted_contact_email: '', trusted_contact_phone: '' }),
                  }))}
                  style={{ marginTop: 4 }}
                />
                Autorizo alertas SOS y de seguridad por correo, SMS y WhatsApp a este contacto. Puedo retirar el consentimiento en cualquier momento; no se enviarán mis coordenadas exactas por esos canales.
              </label>
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ color: validEmail ? '#86efac' : '#fca5a5', fontWeight: 800 }}>Dominio requerido: {uni.domain}</div>
                <button onClick={() => openModal({
                  type: 'profile',
                  title: 'Guardar perfil',
                  accent: '#10b981',
                  message: `Se guardarán los datos de perfil de ${student.name}, incluida la jornada ${student.shift}, el barrio ${student.neighborhood} y el contacto de emergencia.`,
                  confirmText: 'Guardar cambios',
                  onConfirm: confirmProfile,
                })} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 18px', fontWeight: 800 }}>Guardar perfil</button>
              </div>
              <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 24, paddingTop: 20 }}>
                <h3 style={{ marginTop: 0 }}>Foto de perfil</h3>
                {authUser?.photo_url && <img src={authUser.photo_url} alt="Foto de perfil" width="80" height="80" style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input aria-label="Foto de perfil" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProfilePhotoFile(event.target.files?.[0] || null)} />
                  <button onClick={handleProfilePhotoUpload} style={{ ...field, cursor: 'pointer' }}>Subir foto</button>
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 24, paddingTop: 20 }}>
                <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input aria-label="Contraseña actual" type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} style={field} placeholder="Contraseña actual" />
                  <input aria-label="Nueva contraseña" type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} style={field} placeholder="Nueva contraseña (12+)" />
                  <input aria-label="Confirmar nueva contraseña" type="password" value={passwordForm.password_confirmation} onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })} style={field} placeholder="Confirmar nueva contraseña" />
                  <button onClick={handleChangePassword} style={{ ...field, cursor: 'pointer' }}>Actualizar contraseña</button>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>SEGURIDAD</div>
              <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                <Panel title='Validación institucional' value={validEmail ? 'Correo validado' : 'Pendiente'} color='#86efac' />
                <label style={{ display: 'grid', gap: 8 }}><span>Privacidad</span><select value={privacy} onChange={(e) => setPrivacy(e.target.value)} style={field}><option>Zona aproximada</option><option>Ubicación compartida</option><option>Privacidad máxima</option></select></label>
                <Panel title='Contacto de emergencia' value={student.emergency} color='#fbbf24' />
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{authFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(148,163,184,.12)', color: '#dbeafe' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'routes' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 2</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Mapa, geolocalización y rutas</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                {(['origin', 'destination']).map((fieldName) => (
                  <div key={fieldName} style={{ display: 'grid', gap: 8 }}>
                    <label htmlFor={`route-${fieldName}`} style={{ fontWeight: 700 }}>
                      {fieldName === 'origin' ? 'Origen' : 'Destino'}
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        id={`route-${fieldName}`}
                        value={route[fieldName]}
                        onChange={(event) => {
                          setRoute((current) => ({ ...current, [fieldName]: event.target.value }));
                          setRouteLocations((current) => ({ ...current, [fieldName]: null }));
                          setRouteSearchResults((current) => ({ ...current, [fieldName]: [] }));
                          setRouteResult(null);
                        }}
                        style={{ ...field, flex: '1 1 230px' }}
                        placeholder="Busca un lugar en Cali"
                      />
                      <button
                        type="button"
                        onClick={() => searchRouteLocation(fieldName)}
                        disabled={routeSearchLoading === fieldName}
                        style={{ ...field, cursor: 'pointer' }}
                      >
                        {routeSearchLoading === fieldName ? 'Buscando…' : 'Buscar lugar'}
                      </button>
                      {fieldName === 'origin' && (
                        <button
                          type="button"
                          onClick={useDeviceLocation}
                          disabled={locationLoading}
                          style={{ ...field, cursor: 'pointer' }}
                        >
                          {locationLoading ? 'Obteniendo GPS…' : 'Usar mi ubicación'}
                        </button>
                      )}
                    </div>
                    {routeSearchResults[fieldName].length > 0 && (
                      <div role="listbox" aria-label={`Resultados para ${fieldName === 'origin' ? 'origen' : 'destino'}`} style={{ display: 'grid', gap: 6 }}>
                        {routeSearchResults[fieldName].map((result) => (
                          <button
                            type="button"
                            role="option"
                            aria-selected="false"
                            key={result.id}
                            onClick={() => selectRouteLocation(fieldName, result)}
                            style={{ ...field, textAlign: 'left', cursor: 'pointer' }}
                          >
                            {result.fullName}
                          </button>
                        ))}
                      </div>
                    )}
                    <small style={{ color: '#94a3b8' }}>Búsqueda geográfica: © OpenStreetMap contributors (Nominatim).</small>
                    <small style={{ color: routeLocations[fieldName] ? '#86efac' : '#fbbf24' }}>
                      {routeLocations[fieldName] ? 'Coordenadas seleccionadas' : 'Selecciona un resultado para fijar las coordenadas'}
                    </small>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <label style={{ display: 'grid', gap: 8 }}><span>Modo</span><select value={route.mode} onChange={(e) => { setRoute((current) => ({ ...current, mode: e.target.value })); setRouteResult(null); }} style={field}><option value="MIO + caminata">MIO (paradas y trazados oficiales)</option><option>Carro</option><option>Moto (usa ruta vial genérica)</option><option>Bicicleta</option><option>Caminata</option><option>Taxi</option></select></label>
                  <label style={{ display: 'grid', gap: 8 }}><span>Hora</span><input value={route.time} onChange={(e) => setRoute({ ...route, time: e.target.value })} style={field} /></label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ color: '#93c5fd', fontWeight: 700 }}>Ruta real según el perfil de transporte seleccionado</div>
                  <button
                    onClick={calculateRouteNow}
                    disabled={routeLoading}
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 18px', fontWeight: 800, cursor: routeLoading ? 'wait' : 'pointer' }}
                  >
                    {routeLoading ? 'Calculando…' : 'Calcular ruta'}
                  </button>
                </div>
                {routeError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10 }}>{routeError}</div>}
                {routeResult?.mode === 'mio' && (
                  <div style={{ color: '#fde68a', background: 'rgba(120,53,15,.25)', padding: 12, borderRadius: 10 }}>
                    El trazado y las paradas provienen de datos públicos de Metro Cali. Este servicio no ofrece un calendario activo para verificar próximas salidas; por eso no se muestra una hora de llegada ni una frecuencia.
                    {routeResult.routes?.length > 0 && ` Línea(s): ${routeResult.routes.join(', ')}.`}
                    {routeResult.stopDetails?.length > 0 &&
                      ` Paradas: ${routeResult.stopDetails.map(({ role, code }) => `${role} ${code}`).join(' · ')}.`}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                  Tu ubicación solo se obtiene con permiso y no se guarda en la app. Al calcular, las coordenadas se envían al proveedor correspondiente. Se ofrecen rutas viales para carro/taxi, rutas peatonales/ciclistas de OpenStreetMap y rutas genéricas de carro para moto. MIO usa paradas y trazados del servicio público de Metro Cali; no hay un calendario activo verificable, así que no se muestran horarios ni frecuencias.
                </div>
                <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', paddingTop: 14 }}>
                  <strong>Checklist del módulo 2</strong>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    {[
                      { label: '2.1 Obtener ubicación actual con permiso del usuario', done: Boolean(deviceLocation) },
                      { label: '2.2 Buscar y seleccionar coordenadas de origen y destino', done: Boolean(routeLocations.origin && routeLocations.destination) },
                      { label: '2.3 Calcular una ruta real con un proveedor compatible', done: Boolean(routeResult) },
                      { label: '2.4 Mostrar la ruta calculada sobre el mapa', done: Boolean(routeResult) },
                      { label: '2.5 Calcular una ruta real a pie', done: Boolean(routeResult?.mode === 'walk') },
                      { label: '2.6 Calcular una ruta real en bicicleta', done: Boolean(routeResult?.mode === 'bike') },
                      { label: '2.7 Integrar el trazado y las paradas oficiales del MIO', done: Boolean(routeResult?.mode === 'mio') },
                    ].map((item) => (
                      <div key={item.label} style={{ color: item.done ? '#86efac' : '#cbd5e1', fontSize: 13 }}>
                        {item.done ? '☑' : '☐'} {item.label}
                      </div>
                    ))}
                  </div>
                  <small style={{ display: 'block', marginTop: 8, color: '#94a3b8' }}>
                    {Number(Boolean(deviceLocation)) +
                      Number(Boolean(routeLocations.origin && routeLocations.destination)) +
                      Number(Boolean(routeResult)) * 2 +
                      Number(routeResult?.mode === 'walk') +
                      Number(routeResult?.mode === 'bike') +
                      Number(routeResult?.mode === 'mio')}/7 completados
                  </small>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>RESUMEN</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                <Metric label='Tiempo estimado' value={summary.duration} color='#7dd3fc' />
                <Metric label='Distancia' value={summary.distance} color='#86efac' />
                <Metric label='Fuente' value={routeResult?.source || 'Sin ruta calculada'} color='#c4b5fd' />
                <Metric label='Origen' value={route.origin} color='#67e8f9' />
              </div>
              <div style={{ marginTop: 14, background: 'rgba(103,232,249,0.08)', border: '1px solid rgba(103,232,249,0.24)', borderRadius: 12, padding: 12, color: '#dbeafe' }}>
                {routeResult
                  ? `Ruta recibida de ${routeResult.source}. La seguridad del trayecto no ha sido evaluada.`
                  : 'Las distancias y tiempos aparecerán cuando elijas origen y destino y se calcule una ruta real.'}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 16 }}>
              <RouteMap
                origin={routeLocations.origin}
                destination={routeLocations.destination}
                route={routeResult}
                userLocation={deviceLocation}
              />
              <small style={{ display: 'block', marginTop: 8, color: '#94a3b8' }}>Mapa © OpenStreetMap contributors</small>
            </div>
          </section>
        )}

        {active === 'search' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 3</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Búsqueda, filtros y ordenamiento</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}><span>Zona de origen o destino</span><input value={searchState.zone} onChange={(event) => updateSearchFilter('zone', event.target.value)} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Hora de salida</span><input type="time" value={searchState.time} onChange={(event) => updateSearchFilter('time', event.target.value)} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Programa o carrera</span><input value={searchState.faculty} onChange={(event) => updateSearchFilter('faculty', event.target.value)} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Universidad</span><select value={searchState.university} onChange={(event) => updateSearchFilter('university', event.target.value)} style={field}><option>Cualquiera</option>{universities.map((university) => <option key={university.id}>{university.name}</option>)}</select></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Transporte</span><select value={searchState.transport} onChange={(event) => updateSearchFilter('transport', event.target.value)} style={field}><option>Cualquiera</option><option>MIO</option><option>Carro</option><option>Moto</option><option>Bicicleta</option><option>Caminata</option><option>Taxi</option></select></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Orden</span><select value={searchState.sort} onChange={(event) => setSearchState((current) => ({ ...current, sort: event.target.value }))} style={field}><option>Compatibilidad</option><option>Hora de salida</option><option>Más recientes</option></select></label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
                <small style={{ color: '#94a3b8' }}>La hora filtra dentro de la misma hora. Solo aparecen ofertas activas de perfiles con correo verificado.</small>
                <button onClick={() => {
                  setSearchState({ zone: '', time: '', faculty: '', university: 'Cualquiera', transport: 'Cualquiera', sort: 'Compatibilidad' });
                  setSearchLoading(true);
                  setSearchError('');
                  setSearchLoaded(false);
                }} style={{ ...field, padding: '8px 12px', cursor: 'pointer' }}>Limpiar filtros</button>
              </div>
              <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
                {searchLoading && <div role="status" style={{ color: '#bae6fd' }}>Buscando ofertas publicadas…</div>}
                {searchError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10 }}>{searchError}</div>}
                {!searchLoading && !searchError && searchLoaded && filteredResults.length === 0 && (
                  <div role="status" style={{ color: '#cbd5e1', background: 'rgba(148,163,184,.08)', padding: 16, borderRadius: 12 }}>
                    No hay ofertas activas que coincidan con estos filtros. Prueba otra zona, hora o transporte.
                  </div>
                )}
                {!searchLoading && !searchError && filteredResults.map((item) => (
                  <div key={item.id} style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(96,165,250,.28)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{item.name}</div>
                      <div style={{ color: '#93c5fd', fontWeight: 800 }}>{item.score}% afinidad estimada</div>
                    </div>
                    <div style={{ marginTop: 6, color: '#dbeafe' }}>{item.origin} → {item.destination} • {item.time} • {item.transport}</div>
                    <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 13 }}>{item.university}{item.faculty ? ` • ${item.faculty}` : ''} • {item.seats} cupo(s) • {item.cost}</div>
                  </div>
                ))}
                {!searchLoading && searchLoaded && searchTruncated && (
                  <div role="status" style={{ color: '#fde68a' }}>Hay más de 100 ofertas coincidentes. Ajusta los filtros para acotar la búsqueda.</div>
                )}
              </div>
              <small style={{ display: 'block', marginTop: 12, color: '#94a3b8' }}>La afinidad estima coincidencias de barrio, transporte y jornada declarados; no representa una calificación de seguridad ni reputación.</small>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>FILTROS</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{searchFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(125,211,252,.12)', color: '#dbeafe' }}>{f}</span>)}</div>
              <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 20, paddingTop: 16 }}>
                <strong>Checklist del módulo 3</strong>
                <div style={{ display: 'grid', gap: 8, marginTop: 10, color: '#cbd5e1', fontSize: 13 }}>
                  {[
                    { label: '3.1 Consultar ofertas activas de la API con sesión verificada', done: searchLoaded && !searchError },
                    { label: '3.2 Filtrar por zona, hora y transporte', done: true },
                    { label: '3.3 Filtrar por carrera y universidad del perfil', done: true },
                    { label: '3.4 Ordenar por afinidad estimada, hora y fecha', done: true },
                    { label: '3.5 Mostrar carga, error y resultados vacíos', done: true },
                    { label: '3.6 Limitar resultados a ofertas activas de usuarios verificados', done: true },
                    { label: '3.7 Probar filtros, orden y protección de datos', done: true },
                  ].map((item) => <div key={item.label} style={{ color: item.done ? '#86efac' : '#cbd5e1' }}>{item.done ? '☑' : '☐'} {item.label}</div>)}
                </div>
                <small style={{ display: 'block', marginTop: 8, color: '#94a3b8' }}>{6 + Number(searchLoaded && !searchError)}/7 completados. Reputación, género y distancia no se filtran: requieren valoraciones confiables, preferencias voluntarias y coordenadas consentidas que el modelo actual no almacena.</small>
              </div>
            </div>
          </section>
        )}

        {active === 'match' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#a7f3d0', fontWeight: 800 }}>MÓDULO 4</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Emparejamiento de viajes</h2>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>Recomendaciones calculadas desde ofertas activas y verificadas, comparando tu zona, jornada y transporte. No son una garantía de seguridad.</p>
              {matchLoading && <div role="status" style={{ color: '#bae6fd', marginTop: 16 }}>Buscando viajes compatibles…</div>}
              {matchError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10, marginTop: 16 }}>{matchError}</div>}
              {!matchLoading && !matchError && matchLoaded && !matchProfileAvailable && (
                <div role="status" style={{ color: '#fde68a', background: 'rgba(120,53,15,.25)', padding: 12, borderRadius: 10, marginTop: 16 }}>
                  Completa y verifica tu perfil de estudiante para recibir recomendaciones.
                </div>
              )}
              {!matchLoading && !matchError && matchLoaded && matchProfileAvailable && matchResults.length === 0 && (
                <div role="status" style={{ color: '#cbd5e1', background: 'rgba(148,163,184,.08)', padding: 16, borderRadius: 12, marginTop: 16 }}>
                  Aún no hay ofertas verificadas que coincidan con tu zona, jornada o transporte.
                  <button onClick={() => setActive('search')} style={{ ...field, display: 'block', marginTop: 12, padding: '8px 12px', cursor: 'pointer' }}>Buscar todas las ofertas</button>
                </div>
              )}
              <div style={{ display: 'grid', gap: 14 }}>
                {!matchLoading && matchResults.map((match) => (
                  <div key={match.id} style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(52,211,153,.3)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{match.traveler}</div>
                        <div style={{ color: '#cbd5e1' }}>{match.zone} • {match.time}</div>
                      </div>
                      <div style={{ background: 'rgba(16,185,129,.14)', borderRadius: 999, padding: '8px 12px', fontWeight: 800, color: '#a7f3d0' }}>{match.score}% coincidencia</div>
                    </div>
                    <div style={{ marginTop: 8, color: '#dbeafe' }}>Modo: {match.mode} • {match.seats} cupo(s) • {match.cost}</div>
                    <ul style={{ margin: '10px 0', paddingLeft: 20, color: '#bbf7d0' }}>
                      {match.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                    <button
                      onClick={() => {
                        setSearchState((current) => ({
                          ...current,
                          zone: student.neighborhood || '',
                          time: '',
                          transport: 'Cualquiera',
                          sort: 'Compatibilidad',
                        }));
                        setSearchLoading(true);
                        setSearchError('');
                        setSearchLoaded(false);
                        setActive('search');
                      }}
                      style={{ ...field, padding: '8px 12px', cursor: 'pointer' }}
                    >
                      Ver ofertas
                    </button>
                  </div>
                ))}
              </div>
              {!matchLoading && matchLoaded && matchTruncated && (
                <div role="status" style={{ color: '#fde68a', marginTop: 12 }}>Se evaluaron las 200 ofertas más recientes. La lista puede estar incompleta; revisa las ofertas en Búsqueda.</div>
              )}
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>RECOMENDACIÓN</div>
              <div style={{ marginTop: 12, color: '#cbd5e1' }}>El puntaje es explicable: zona 50%, jornada 35% y transporte 15%. Solo se consideran datos declarados y ofertas publicadas; se muestran coincidencias desde 30 puntos.</div>
              <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{matchFns.map(f => <span key={f} style={{ padding: '6px 8px', fontSize: 10, borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#d1fae5' }}>{f}</span>)}</div>
              <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 20, paddingTop: 16 }}>
                <strong>Checklist del módulo 4</strong>
                <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 13 }}>
                  {[
                    { label: '4.1 Leer perfil propio verificado sin usar datos de demostración', done: matchLoaded && matchProfileAvailable },
                    { label: '4.2 Encontrar ofertas activas de otros estudiantes verificados', done: true },
                    { label: '4.3 Comparar barrio con origen y destino publicados', done: true },
                    { label: '4.4 Comparar hora con la jornada declarada', done: true },
                    { label: '4.5 Comparar transporte declarado con el de la oferta', done: true },
                    { label: '4.6 Mostrar puntaje explicable y motivos de coincidencia', done: true },
                    { label: '4.7 Proteger datos privados y probar acceso y filtros', done: true },
                  ].map((item) => <div key={item.label} style={{ color: item.done ? '#86efac' : '#cbd5e1' }}>{item.done ? '☑' : '☐'} {item.label}</div>)}
                </div>
                <small style={{ display: 'block', marginTop: 8, color: '#94a3b8' }}>{6 + Number(matchLoaded && matchProfileAvailable)}/7 completados. El paso pendiente es cargar las recomendaciones del perfil actual; los controles de cupo pertenecen al módulo de gestión de viajes.</small>
              </div>
            </div>
          </section>
        )}

        {active === 'trips' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fbbf24', fontWeight: 800 }}>MÓDULO 5</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Gestión de viajes</h2>
              <p style={{ color: '#cbd5e1' }}>Publica ofertas reales, solicita cupos y administra las respuestas desde tu cuenta verificada.</p>
              {tripLoading && <div role="status" style={{ color: '#bae6fd' }}>Cargando ofertas y solicitudes…</div>}
              {tripError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10, margin: '12px 0' }}>{tripError}</div>}

              <h3 style={{ marginTop: 20 }}>Ofertas disponibles</h3>
              {!tripLoading && !tripError && tripCards.length === 0 && <div role="status" style={{ color: '#cbd5e1' }}>No hay ofertas activas disponibles en este momento.</div>}
              <div style={{ display: 'grid', gap: 12 }}>
                {tripCards.map((offer) => (
                  <div key={offer.id} style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div><div style={{ fontSize: 20, fontWeight: 800 }}>{offer.name}</div><div style={{ color: '#dbeafe' }}>{offer.origin} → {offer.destination} • {offer.time}</div></div>
                      <div style={{ color: '#fbbf24', fontWeight: 800 }}>{offer.university}</div>
                    </div>
                    <div style={{ marginTop: 8, color: '#dbeafe' }}>Modo: {offer.transport} • {offer.seats} cupo(s) • {offer.cost}</div>
                    <button
                      disabled={tripActionLoading === `request-${offer.id}` || offer.seats < 1 || myTripData.requests.some((item) => item.offer.id === offer.id)}
                      onClick={() => runTripAction(`request-${offer.id}`, () => requestTravelSeat(offer.id), 'Solicitud enviada al responsable de la oferta.')}
                      style={{ marginTop: 12, border: '1px solid rgba(251,191,36,.3)', background: 'rgba(245,158,11,.12)', color: '#fff', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {tripActionLoading === `request-${offer.id}` ? 'Enviando…' : myTripData.requests.some((item) => item.offer.id === offer.id) ? 'Solicitud registrada' : 'Solicitar cupo'}
                    </button>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: 24 }}>Mis ofertas y solicitudes entrantes</h3>
              {!tripLoading && !tripError && myTripData.offers.length === 0 && <div style={{ color: '#cbd5e1' }}>Aún no has publicado ofertas.</div>}
              <div style={{ display: 'grid', gap: 12 }}>
                {myTripData.offers.map((offer) => (
                  <div key={offer.id} style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontWeight: 800 }}>{offer.origin} → {offer.destination} • {offer.departure_time}</div>
                    <div style={{ marginTop: 4, color: '#cbd5e1' }}>{tripStatusLabels[offer.status] || offer.status} • {offer.seats} cupo(s) disponibles • {offer.cost}</div>
                    {offer.requests.map((tripRequest) => (
                      <div key={tripRequest.id} style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(148,163,184,.18)' }}>
                        <div>{tripRequest.requester.name} • {tripRequest.requester.university} • {tripStatusLabels[tripRequest.status] || tripRequest.status}</div>
                        {tripRequest.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button disabled={tripActionLoading === `accept-${tripRequest.id}`} onClick={() => runTripAction(`accept-${tripRequest.id}`, () => updateTravelRequest(tripRequest.id, 'accepted'), 'Solicitud aceptada y cupo reservado.')} style={{ ...field, padding: '7px 10px', cursor: 'pointer' }}>Aceptar</button>
                            <button disabled={tripActionLoading === `reject-${tripRequest.id}`} onClick={() => runTripAction(`reject-${tripRequest.id}`, () => updateTravelRequest(tripRequest.id, 'rejected'), 'Solicitud rechazada.')} style={{ ...field, padding: '7px 10px', cursor: 'pointer' }}>Rechazar</button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {offer.status === 'oferta-activa' && offer.requests.some((item) => item.status === 'accepted') && (
                        <button onClick={() => runTripAction(`start-${offer.id}`, () => updateTravelOfferStatus(offer.id, 'en-curso'), 'Viaje iniciado.')} style={{ ...field, padding: '7px 10px', cursor: 'pointer' }}>Iniciar viaje</button>
                      )}
                      {offer.status === 'en-curso' && (
                        <button onClick={() => runTripAction(`complete-${offer.id}`, () => updateTravelOfferStatus(offer.id, 'completada'), 'Viaje marcado como completado.')} style={{ ...field, padding: '7px 10px', cursor: 'pointer' }}>Completar viaje</button>
                      )}
                      {offer.status === 'oferta-activa' && (
                        <button onClick={() => runTripAction(`cancel-${offer.id}`, () => updateTravelOfferStatus(offer.id, 'cancelada'), 'Oferta cancelada.')} style={{ ...field, padding: '7px 10px', cursor: 'pointer' }}>Cancelar oferta</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: 24 }}>Mis solicitudes</h3>
              {!tripLoading && !tripError && myTripData.requests.length === 0 && <div style={{ color: '#cbd5e1' }}>No has solicitado cupos.</div>}
              <div style={{ display: 'grid', gap: 10 }}>
                {myTripData.requests.map((tripRequest) => (
                  <div key={tripRequest.id} style={{ background: 'rgba(59,130,246,.08)', borderRadius: 12, padding: 14 }}>
                    <div>{tripRequest.offer.owner} • {tripRequest.offer.origin} → {tripRequest.offer.destination} • {tripRequest.offer.departure_time}</div>
                    <div style={{ color: '#cbd5e1', marginTop: 4 }}>Solicitud: {tripStatusLabels[tripRequest.status] || tripRequest.status} • Viaje: {tripStatusLabels[tripRequest.offer.status] || tripRequest.offer.status}</div>
                    {['pending', 'accepted'].includes(tripRequest.status) && tripRequest.offer.status === 'oferta-activa' && (
                      <button onClick={() => runTripAction(`withdraw-${tripRequest.id}`, () => updateTravelRequest(tripRequest.id, 'cancelled'), tripRequest.status === 'accepted' ? 'Participación cancelada y cupo liberado.' : 'Solicitud cancelada.')} style={{ ...field, marginTop: 8, padding: '7px 10px', cursor: 'pointer' }}>
                        {tripRequest.status === 'accepted' ? 'Cancelar participación' : 'Cancelar solicitud'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {['admin', 'security'].includes(authUser?.role) && (
                <div style={{ marginTop: 18, color: '#cbd5e1' }}>
                  La vista de alertas de emergencia está disponible para cuentas de seguridad y administración activas.
                </div>
              )}
              {authUser?.role === 'student' && (
                <div style={{ marginTop: 22, borderTop: '1px solid rgba(148,163,184,.2)', paddingTop: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Seguridad del viaje en curso</h3>
                  {safetyTripOptions.length === 0 ? (
                    <div style={{ color: '#cbd5e1' }}>No tienes viajes en curso con participantes aceptados.</div>
                  ) : (
                    <>
                      <label style={{ display: 'grid', gap: 6, color: '#dbeafe' }}>
                        Viaje
                        <select
                          value={selectedSafetyTripId}
                          onChange={async (event) => {
                            const nextTripId = event.target.value;
                            if (sharingTripLocation && selectedSafetyTripId) {
                              try {
                                await tripLocationUpdateRef.current;
                                await stopSharingTripLocation(selectedSafetyTripId);
                                setSharingTripLocation(false);
                              } catch (error) {
                                setSafetyError(error.message || 'No fue posible detener el GPS antes de cambiar de viaje.');
                                return;
                              }
                            }
                            setSelectedSafetyTripId(nextTripId);
                          }}
                          style={field}
                        >
                          {safetyTripOptions.map((trip) => <option key={`${trip.id}-${trip.label}`} value={trip.id}>{trip.label}</option>)}
                        </select>
                      </label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        <button
                          disabled={safetyActionLoading === 'share-location'}
                          onClick={sharingTripLocation ? stopTripLocationSharing : startTripLocationSharing}
                          style={{ ...field, cursor: 'pointer' }}
                        >
                          {safetyActionLoading === 'share-location'
                            ? 'Obteniendo GPS…'
                            : safetyActionLoading === 'stop-sharing'
                              ? 'Retirando ubicación…'
                            : sharingTripLocation
                              ? 'Dejar de compartir ubicación'
                              : 'Compartir mi ubicación con este viaje'}
                        </button>
                        <button
                          disabled={safetyActionLoading === 'check-in-departure' || tripSafetyStatus.check_ins.some((item) => item.user_id === authUser.id && item.type === 'departure')}
                          onClick={() => recordTripCheckIn('departure')}
                          style={{ ...field, cursor: 'pointer' }}
                        >
                          Confirmar salida
                        </button>
                        <button
                          disabled={safetyActionLoading === 'check-in-arrival' || tripSafetyStatus.check_ins.some((item) => item.user_id === authUser.id && item.type === 'arrival')}
                          onClick={() => recordTripCheckIn('arrival')}
                          style={{ ...field, cursor: 'pointer' }}
                        >
                          Confirmar llegada
                        </button>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: 12 }}>
                        El GPS se comparte solo mientras esta pantalla está abierta y el seguimiento está activo. Se actualiza cada 15 segundos, desaparece del panel tras 2 minutos sin actualización y se elimina al completar o cancelar el viaje.
                      </p>
                      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                        {tripSafetyStatus.locations.map((location) => (
                          <div key={location.user_id} style={{ borderRadius: 10, padding: 10, background: 'rgba(59,130,246,.08)' }}>
                            <div>{location.name} • ubicación actual</div>
                            <a href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#93c5fd' }}>
                              Ver ubicación en el mapa
                            </a>
                            <div style={{ color: '#94a3b8', fontSize: 11 }}>Actualizada: {new Date(location.captured_at).toLocaleTimeString()}</div>
                          </div>
                        ))}
                        {tripSafetyStatus.check_ins.map((checkIn) => (
                          <div key={`${checkIn.user_id}-${checkIn.type}`} style={{ borderRadius: 10, padding: 10, background: 'rgba(16,185,129,.08)' }}>
                            {checkIn.name} • {checkIn.type === 'departure' ? 'Salida confirmada' : 'Llegada confirmada'} • {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                          </div>
                        ))}
                        {tripSafetyStatus.safety_events.map((safetyEvent) => (
                          <div key={`${safetyEvent.user_id}-${safetyEvent.type}`} style={{ borderRadius: 10, padding: 10, background: 'rgba(245,158,11,.08)' }}>
                            <div>
                              {safetyEvent.type === 'route_deviation'
                                ? 'Alerta: salida del corredor de ruta'
                                : safetyEvent.type === 'arrival_geofence'
                                  ? 'Participante dentro de la zona de llegada'
                                  : 'Check-in de llegada vencido'}
                              {' • '}{new Date(safetyEvent.occurred_at).toLocaleTimeString()}
                            </div>
                            {safetyEvent.notifications.map((delivery) => (
                              <div key={delivery.channel} style={{ color: delivery.status === 'sent' ? '#86efac' : '#fcd34d', fontSize: 12 }}>
                                Contacto {delivery.channel}: {delivery.status === 'sent' ? 'entregado por el proveedor' : delivery.status === 'pending' ? 'en cola' : delivery.status === 'failed' ? 'falló' : 'no configurado'}
                                {delivery.failure_reason ? ` — ${delivery.failure_reason}` : ''}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>PUBLICAR OFERTA</div>
              <form onSubmit={submitTripOffer} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <label style={{ display: 'grid', gap: 6 }}>Origen<input required maxLength={120} value={tripOfferForm.origin} onChange={(event) => setTripOfferForm((current) => ({ ...current, origin: event.target.value }))} style={field} /></label>
                <label style={{ display: 'grid', gap: 6 }}>Destino<input required maxLength={120} value={tripOfferForm.destination} onChange={(event) => setTripOfferForm((current) => ({ ...current, destination: event.target.value }))} style={field} /></label>
                <label style={{ display: 'grid', gap: 6 }}>Hora de salida<input required type="time" value={tripOfferForm.departure_time} onChange={(event) => setTripOfferForm((current) => ({ ...current, departure_time: event.target.value }))} style={field} /></label>
                <label style={{ display: 'grid', gap: 6 }}>Transporte<input required maxLength={80} value={tripOfferForm.mode} onChange={(event) => setTripOfferForm((current) => ({ ...current, mode: event.target.value }))} style={field} /></label>
                <label style={{ display: 'grid', gap: 6 }}>Cupos<input required type="number" min="1" max="20" value={tripOfferForm.seats} onChange={(event) => setTripOfferForm((current) => ({ ...current, seats: event.target.value }))} style={field} /></label>
                <label style={{ display: 'grid', gap: 6 }}>Aporte por persona<input required maxLength={40} value={tripOfferForm.cost} onChange={(event) => setTripOfferForm((current) => ({ ...current, cost: event.target.value }))} style={field} /></label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#dbeafe', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={tripGeofenceConsent}
                  onChange={(event) => {
                    setTripGeofenceConsent(event.target.checked);
                    setTripGeofencePreview(null);
                  }}
                  style={{ marginTop: 4 }}
                />
                Configurar geocerca de este viaje. Se geocodificarán las direcciones y se guardará el trazado para alertas a los contactos que hayan dado consentimiento.
                </label>
                {tripGeofenceConsent && (
                <>
                  {hasCurrentGeofencePreview && (
                    <div style={{ borderRadius: 10, padding: 10, background: 'rgba(59,130,246,.08)', color: '#dbeafe', fontSize: 12 }}>
                      <div>Origen detectado: {tripGeofencePreview.origin}</div>
                      <div>Destino detectado: {tripGeofencePreview.destination}</div>
                      <div>Fuente de ruta: {tripGeofencePreview.source}</div>
                      <div>Si un resultado no corresponde, ajusta la dirección antes de confirmar la oferta.</div>
                    </div>
                  )}
                  <label style={{ display: 'grid', gap: 6 }}>
                      Duración estimada del viaje (minutos)
                      <input
                        required
                        type="number"
                        min="1"
                        max="600"
                        value={tripOfferForm.safety_route_duration_minutes}
                        onChange={(event) => setTripOfferForm((current) => ({ ...current, safety_route_duration_minutes: event.target.value }))}
                        style={field}
                      />
                    </label>
                    <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
                      Origen/destino se consultan con OpenStreetMap y el trazado se calcula con OSRM o datos públicos del MIO. El backend activa una alerta al salir más de 500 m del corredor, entrar a 300 m del destino o no confirmar llegada 15 min después de la duración indicada. Solo funciona cuando cada participante comparte GPS expresamente; se notifica el evento, no las coordenadas.
                    </p>
                  </>
                )}
                <button disabled={tripActionLoading === 'create'} type="submit" style={{ border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}>
                  {tripActionLoading === 'create'
                    ? 'Configurando…'
                    : tripGeofenceConsent && hasCurrentGeofencePreview
                      ? 'Confirmar ruta y publicar'
                      : tripGeofenceConsent
                        ? 'Previsualizar geocerca'
                        : 'Publicar oferta'}
                </button>
              </form>
              <button onClick={calculateTravelCost} style={{ marginTop: 12, border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, background: '#0f172a', color: '#fff', padding: '10px 12px', fontWeight: 800 }}>Calcular costo estimado de ruta</button>
              <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 20, paddingTop: 16 }}>
                <strong>Checklist del módulo 5</strong>
                <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 13, color: '#86efac' }}>
                  {[
                    '5.1 Publicar ofertas desde un perfil verificado',
                    '5.2 Consultar ofertas activas y sus cupos reales',
                    '5.3 Solicitar cupo y consultar su estado',
                    '5.4 Aceptar o rechazar solicitudes como responsable',
                    '5.5 Evitar sobreventa al confirmar cupos',
                    '5.6 Cancelar ofertas, solicitudes y participaciones previas al inicio',
                    '5.7 Iniciar y completar viajes con transiciones válidas',
                  ].map((item) => <div key={item}>☑ {item}</div>)}
                </div>
              </div>
            </div>
          </section>
        )}

        {active === 'safety' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fca5a5', fontWeight: 800 }}>MÓDULO 6</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Seguridad y ubicación real</h2>
              <p style={{ color: '#cbd5e1' }}>Las alertas SOS quedan registradas para personal autorizado. Los participantes de viajes en curso pueden compartir GPS y registrar check-in. No se contacta automáticamente a autoridades ni contactos de confianza.</p>
              {safetyError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10, margin: '12px 0' }}>{safetyError}</div>}
              {safetyAlertsLoading && <div role="status" style={{ color: '#bae6fd' }}>Cargando alertas activas…</div>}
              {!safetyAlertsLoading && alertFeed.length === 0 && (
                <div role="status" style={{ color: '#cbd5e1' }}>
                  {['admin', 'security'].includes(authUser?.role)
                    ? 'No hay alertas SOS activas.'
                    : 'Todavía no hay alertas SOS registradas durante esta sesión.'}
                </div>
              )}
              <div style={{ display: 'grid', gap: 14 }}>
                {alertFeed.map((a) => (
                  <div key={a.id} style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 800 }}>{a.type}</div>
                      <div style={{ color: '#fca5a5', fontWeight: 700 }}>{a.active ? 'Activa' : 'Atendida'}</div>
                    </div>
                    <div style={{ marginTop: 6, color: '#fecaca' }}>{a.message}</div>
                    {a.student_profile?.name && <div style={{ marginTop: 6, color: '#cbd5e1' }}>Estudiante: {a.student_profile.name} • {a.student_profile.university}</div>}
                    {a.latitude !== null && a.latitude !== undefined && a.longitude !== null && a.longitude !== undefined && (
                      <a href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}#map=17/${a.latitude}/${a.longitude}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, color: '#93c5fd' }}>
                        Ver ubicación GPS{a.accuracy_meters ? ` (±${a.accuracy_meters} m)` : ''}
                      </a>
                    )}
                    {['admin', 'security'].includes(authUser?.role) && a.active && (
                      <button
                        disabled={safetyActionLoading === `resolve-${a.id}`}
                        onClick={() => handleResolveSafetyAlert(a.id)}
                        style={{ display: 'block', ...field, marginTop: 10, padding: '7px 10px', cursor: 'pointer' }}
                      >
                        {safetyActionLoading === `resolve-${a.id}` ? 'Actualizando…' : 'Marcar como atendida'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>EMERGENCIA</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <button onClick={() => {
                  setIncludeSafetyLocation(false);
                  setSafetyLocationError('');
                  openModal({
                    type: 'panic',
                    title: 'Registrar alerta SOS',
                    accent: '#ef4444',
                    message: `Se registrará una alerta SOS de ${student.name} para el equipo de seguridad. Si eliges incluir tu GPS, el navegador pedirá permiso y las coordenadas se enviarán junto con la alerta. La app no avisará automáticamente a autoridades ni contactos.`,
                    confirmText: 'Activar SOS',
                    onConfirm: confirmEmergency,
                  });
                }} disabled={safetyActionLoading === 'panic'} style={{ border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>Activar botón de pánico</button>
                <div style={{ color: '#cbd5e1', background: 'rgba(148,163,184,.08)', borderRadius: 12, padding: 12 }}>
                  El GPS requiere activación voluntaria. Las alertas por correo/SMS/WhatsApp solo se envían con consentimiento del contacto y SMTP/Twilio configurados; no se notifican automáticamente autoridades ni servicios de emergencia.
                </div>
                <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 8, paddingTop: 14 }}>
                  <strong>Checklist del módulo 6</strong>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 13 }}>
                    <div style={{ color: '#86efac' }}>☑ 6.1 Registrar una alerta SOS persistente</div>
                    <div style={{ color: '#86efac' }}>☑ 6.2 Consultar y atender alertas con rol autorizado</div>
                    <div style={{ color: '#86efac' }}>☑ 6.3 Adjuntar ubicación GPS actual si el estudiante lo autoriza</div>
                    <div style={{ color: '#86efac' }}>☑ 6.4 Ubicación compartida y check-in durante el viaje activo</div>
                    <div style={{ color: '#86efac' }}>☑ 6.5 Geocerca de ruta/destino y alertas por check-in vencido (si el viaje lo configura)</div>
                    <div style={{ color: '#86efac' }}>☑ 6.6 Notificaciones opt-in a contactos por correo/SMS/WhatsApp (requiere configuración externa)</div>
                    <div style={{ color: '#cbd5e1' }}>☐ 6.7 Integración con autoridades/servicios de emergencia</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {active === 'admin' && (
          <section style={{ display: 'grid', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#c4b5fd', fontWeight: 800 }}>MÓDULO 7</div>
                  <h2 style={{ margin: '10px 0 6px', fontSize: 34 }}>Administración y analytics</h2>
                  <div style={{ color: '#cbd5e1' }}>
                    {currentAdminDashboard?.scope?.global
                      ? 'Alcance: toda la plataforma'
                      : `Alcance institucional: ${currentAdminDashboard?.scope?.university || authUser?.university || 'universidad sin asignar'}`}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!currentAdminDashboard || adminDashboardLoading}
                  onClick={exportAdminAnalytics}
                  style={{ border: '1px solid rgba(196,181,253,.4)', borderRadius: 10, padding: '10px 14px', background: 'rgba(139,92,246,.16)', color: '#e9d5ff', fontWeight: 800, cursor: currentAdminDashboard ? 'pointer' : 'not-allowed' }}
                >
                  Exportar métricas JSON
                </button>
              </div>

              {adminDashboardLoading && <p role="status" style={{ color: '#cbd5e1' }}>Cargando métricas verificadas del servidor…</p>}
              {adminDashboardError && <p role="alert" style={{ color: '#fca5a5' }}>{adminDashboardError}</p>}
              {currentAdminDashboard && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginTop: 20 }}>
                    {[
                      ['Usuarios registrados', currentAdminDashboard.stats.registered_users],
                      ['Perfiles estudiantiles', currentAdminDashboard.stats.students],
                      ['Ofertas activas', currentAdminDashboard.stats.active_trips],
                      ['Viajes completados', currentAdminDashboard.stats.completed_trips],
                      ['Solicitudes de cupo', currentAdminDashboard.stats.trip_requests],
                      ['Solicitudes aceptadas', currentAdminDashboard.stats.accepted_requests],
                      ['Aceptación de solicitudes', currentAdminDashboard.stats.request_acceptance_rate === null ? 'Sin datos' : `${currentAdminDashboard.stats.request_acceptance_rate}%`],
                      ['Alertas sin resolver', currentAdminDashboard.stats.active_alerts],
                      ['Coincidencias registradas', currentAdminDashboard.stats.matches],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(196,181,253,.3)', borderRadius: 14, padding: 18 }}>
                        <div style={{ color: '#d8b4fe', fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value ?? 0}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 20 }}>
                    {[
                      ['Por universidad', currentAdminDashboard.distribution.by_university],
                      ['Por barrio', currentAdminDashboard.distribution.by_neighborhood],
                      ['Por jornada', currentAdminDashboard.distribution.by_shift],
                    ].map(([title, rows]) => (
                      <div key={title} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 16 }}>
                        <strong>{title}</strong>
                        {rows?.length
                          ? rows.map((row) => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10, color: '#cbd5e1' }}>
                              <span>{row.label}</span><span>{row.total}</span>
                            </div>
                          ))
                          : <div style={{ marginTop: 10, color: '#94a3b8' }}>Sin datos disponibles.</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>Checklist del módulo 7</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {adminChecklist.map((item) => (
                  <div key={item.id} style={{ color: item.done ? '#86efac' : '#cbd5e1' }}>
                    {item.done ? '☑' : '☐'} {item.id} {item.label}
                  </div>
                ))}
              </div>
              <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 0 }}>
                Las valoraciones de reputación siguen fuera de este módulo. La importación GTFS valida y guarda paradas/rutas; no importa viajes, horarios ni calendarios.
              </p>
            </div>

            {adminManagementError && (
              <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10 }}>
                {adminManagementError}
              </div>
            )}
            {adminManagementLoading && <div role="status" style={{ color: '#cbd5e1' }}>Actualizando panel administrativo…</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
                <h3 style={{ marginTop: 0 }}>Cuentas y verificación de perfiles</h3>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setAdminUserFilters((current) => ({ ...current, search: adminUserSearch, page: 1 }));
                  }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}
                >
                  <input
                    aria-label="Buscar estudiante por nombre o correo"
                    placeholder="Nombre o correo"
                    value={adminUserSearch}
                    onChange={(event) => setAdminUserSearch(event.target.value)}
                    style={field}
                  />
                  <select
                    aria-label="Filtrar estado de cuenta"
                    value={adminUserFilters.status}
                    onChange={(event) => setAdminUserFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
                    style={field}
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">Activa</option>
                    <option value="pending">Pendiente</option>
                    <option value="blocked">Bloqueada</option>
                  </select>
                  <select
                    aria-label="Filtrar verificación de perfil"
                    value={adminUserFilters.verification}
                    onChange={(event) => setAdminUserFilters((current) => ({ ...current, verification: event.target.value, page: 1 }))}
                    style={field}
                  >
                    <option value="">Todos los perfiles</option>
                    <option value="pending">Verificación pendiente</option>
                    <option value="verified">Verificado</option>
                  </select>
                  <button type="submit" style={{ ...field, cursor: 'pointer', fontWeight: 800 }}>Buscar</button>
                </form>
                <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                  {adminUsers.map((user) => (
                    <div key={user.id} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <strong>{user.name}</strong>
                          <div style={{ color: '#94a3b8', fontSize: 12 }}>{user.email} · {user.university || 'Sin universidad'}</div>
                          <div style={{ color: '#cbd5e1', fontSize: 12 }}>
                            Cuenta: {user.status} · Perfil: {user.profile_verified ? 'verificado' : 'pendiente'} · Correo: {user.email_verified_at ? 'verificado' : 'pendiente'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {!user.profile_verified && (
                            <button
                              type="button"
                              disabled={adminManagementAction === `user-${user.id}`}
                              onClick={() => saveAdminUser(user, { profile_verified: true })}
                              style={field}
                            >
                              Verificar perfil
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={adminManagementAction === `user-${user.id}`}
                            onClick={() => saveAdminUser(user, { status: user.status === 'blocked' ? 'active' : 'blocked' })}
                            style={field}
                          >
                            {user.status === 'blocked' ? 'Reactivar' : 'Bloquear'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!adminUsers.length && !adminManagementLoading && <div style={{ color: '#94a3b8' }}>No hay cuentas para los filtros seleccionados.</div>}
                </div>
                {adminUserMeta.total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14, color: '#94a3b8', fontSize: 12 }}>
                    <span>{adminUserMeta.total} cuentas · página {adminUserMeta.current_page} de {adminUserMeta.last_page}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" disabled={adminUserMeta.current_page <= 1} onClick={() => setAdminUserFilters((current) => ({ ...current, page: adminUserMeta.current_page - 1 }))} style={field}>Anterior</button>
                      <button type="button" disabled={adminUserMeta.current_page >= adminUserMeta.last_page} onClick={() => setAdminUserFilters((current) => ({ ...current, page: adminUserMeta.current_page + 1 }))} style={field}>Siguiente</button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ marginTop: 0 }}>Incidentes de seguridad</h3>
                  <select
                    aria-label="Filtrar incidentes por estado"
                    value={adminIncidentStatus}
                    onChange={(event) => {
                      setAdminIncidentStatus(event.target.value);
                      setAdminIncidentPage(1);
                    }}
                    style={field}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Sin resolver</option>
                    <option value="resolved">Atendidos</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {adminIncidents.map((incident) => (
                    <div key={incident.id} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 12 }}>
                      <strong>{incident.type} · {incident.severity}</strong>
                      <div style={{ color: '#cbd5e1', fontSize: 12 }}>{incident.student || 'Perfil eliminado'} · {incident.university || 'Universidad desconocida'}</div>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>
                        {incident.active ? 'Sin resolver' : 'Atendido'} · {incident.created_at ? new Date(incident.created_at).toLocaleString() : 'Fecha no disponible'}
                      </div>
                    </div>
                  ))}
                  {!adminIncidents.length && !adminManagementLoading && <div style={{ color: '#94a3b8' }}>No hay incidentes registrados en este alcance.</div>}
                </div>
                {adminIncidentMeta.total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14, color: '#94a3b8', fontSize: 12 }}>
                    <span>{adminIncidentMeta.total} incidentes · página {adminIncidentMeta.current_page} de {adminIncidentMeta.last_page}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" disabled={adminIncidentMeta.current_page <= 1} onClick={() => setAdminIncidentPage(adminIncidentMeta.current_page - 1)} style={field}>Anterior</button>
                      <button type="button" disabled={adminIncidentMeta.current_page >= adminIncidentMeta.last_page} onClick={() => setAdminIncidentPage(adminIncidentMeta.current_page + 1)} style={field}>Siguiente</button>
                    </div>
                  </div>
                )}
                <p style={{ color: '#94a3b8', fontSize: 12 }}>
                  Este listado omite coordenadas y datos de contacto. La resolución operativa está disponible en el panel de seguridad.
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ marginTop: 0 }}>Catálogos institucionales</h3>
                  <p style={{ color: '#94a3b8', marginTop: 0 }}>Gestiona sedes, facultades, programas y periodos. Los elementos se desactivan sin borrar su historial.</p>
                </div>
                {authUser?.role === 'admin' && (
                  <label style={{ display: 'grid', gap: 6 }}>
                    Universidad del catálogo
                    <select value={adminSelectedUniversity} onChange={(event) => setAdminSelectedUniversity(event.target.value)} style={field}>
                      <option value="">Selecciona universidad</option>
                      {adminUniversities.map((university) => <option key={university} value={university}>{university}</option>)}
                    </select>
                  </label>
                )}
              </div>
              {adminSelectedUniversity || authUser?.role === 'university' ? (
                <>
                  <form onSubmit={createAdminCatalogEntry} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
                    <select
                      value={adminCatalogForm.type}
                      onChange={(event) => setAdminCatalogForm((current) => ({ ...current, type: event.target.value }))}
                      style={field}
                    >
                      {catalogTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                    <input
                      required
                      maxLength={120}
                      value={adminCatalogForm.name}
                      onChange={(event) => setAdminCatalogForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Nombre del elemento"
                      style={{ ...field, flex: 1, minWidth: 180 }}
                    />
                    <button type="submit" disabled={adminManagementAction === 'catalog'} style={{ ...field, cursor: 'pointer' }}>Agregar</button>
                  </form>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {adminCatalog.map((entry) => (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: '1px solid rgba(148,163,184,.2)', borderRadius: 10, padding: 10 }}>
                        <span>{catalogTypes.find((type) => type.value === entry.type)?.label}: {entry.name}</span>
                        <button
                          type="button"
                          disabled={adminManagementAction === `catalog-${entry.id}`}
                          onClick={() => deactivateAdminCatalogEntry(entry)}
                          style={{ ...field, cursor: 'pointer' }}
                        >
                          Desactivar
                        </button>
                      </div>
                    ))}
                    {!adminCatalog.length && <div style={{ color: '#94a3b8' }}>No hay elementos activos en este catálogo.</div>}
                  </div>
                </>
              ) : <div style={{ color: '#fcd34d' }}>Selecciona una universidad para consultar o editar sus catálogos.</div>}
            </div>

            {authUser?.role === 'admin' && (
              <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
                <h3 style={{ marginTop: 0 }}>Importar datos estáticos GTFS</h3>
                <p style={{ color: '#cbd5e1' }}>
                  Importa `stops.txt` y `routes.txt` (CSV UTF-8) de un feed de Metro Cali. Se verifican encabezados, IDs únicos, nombres y coordenadas; el máximo es 50.000 filas por archivo. No se importan ni publican horarios ni calendarios.
                </p>
                <form onSubmit={submitAdminTransitFeed} style={{ display: 'grid', gap: 10 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    Versión o fecha del feed
                    <input required maxLength={120} value={adminFeedVersion} onChange={(event) => setAdminFeedVersion(event.target.value)} style={field} />
                  </label>
                  <label style={{ display: 'grid', gap: 6 }}>
                    stops.txt
                    <input required type="file" accept=".txt,.csv,text/csv,text/plain" onChange={(event) => setAdminStopsFile(event.target.files?.[0] || null)} style={field} />
                  </label>
                  <label style={{ display: 'grid', gap: 6 }}>
                    routes.txt
                    <input required type="file" accept=".txt,.csv,text/csv,text/plain" onChange={(event) => setAdminRoutesFile(event.target.files?.[0] || null)} style={field} />
                  </label>
                  <button type="submit" disabled={adminManagementAction === 'gtfs'} style={{ ...field, cursor: 'pointer', fontWeight: 800 }}>
                    {adminManagementAction === 'gtfs' ? 'Validando…' : 'Validar e importar'}
                  </button>
                </form>
                {adminLatestFeed && (
                  <div role="status" style={{ marginTop: 14, color: '#86efac' }}>
                    Último feed: {adminLatestFeed.feed_version} · {adminLatestFeed.stops_count} paradas · {adminLatestFeed.routes_count} rutas
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {active === 'trust' && (
          <section style={{ display: 'grid', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#c4b5fd', fontWeight: 800 }}>MÓDULO 8</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Confiabilidad y reputación</h2>
              {reputationLoading && <p role="status" style={{ color: '#cbd5e1' }}>Cargando calificaciones verificadas…</p>}
              {reputationError && <p role="alert" style={{ color: '#fca5a5' }}>{reputationError}</p>}
              {authUser?.role === 'student' && reputationData && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    <Metric
                      label="Calificación recibida"
                      value={reputationData.summary.rating_average === null
                        ? 'Sin calificaciones'
                        : `${reputationData.summary.rating_average}/5 (${reputationData.summary.rating_count})`}
                      color="#a78bfa"
                    />
                    <Metric label="Viajes completados" value={reputationData.summary.completed_trips} color="#c4b5fd" />
                    <Metric label="Valoraciones pendientes" value={reputationData.pending_trips.length} color="#fbbf24" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 24 }}>
                    <form onSubmit={submitReputationReview} style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                      <h3 style={{ margin: 0 }}>Valorar participante de un viaje</h3>
                      <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                        Viaje completado
                        <select required value={reviewForm.trip_id} onChange={(event) => setReviewForm((current) => ({ ...current, trip_id: event.target.value, reviewee_profile_id: '' }))} style={field}>
                          <option value="">Selecciona un viaje</option>
                          {reputationData.completed_trips.map((trip) => <option key={trip.trip_id} value={trip.trip_id}>{trip.route}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                        Participante
                        <select required value={reviewForm.reviewee_profile_id} onChange={(event) => setReviewForm((current) => ({ ...current, reviewee_profile_id: event.target.value }))} style={field}>
                          <option value="">Selecciona a quién valorar</option>
                          {reputationData.completed_trips.find((trip) => String(trip.trip_id) === reviewForm.trip_id)?.participants
                            .filter((participant) => !participant.reviewed)
                            .map((participant) => <option key={participant.profile_id} value={participant.profile_id}>{participant.name} · {participant.university}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                        Calificación
                        <select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))} style={field}>
                          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} de 5 estrellas</option>)}
                        </select>
                      </label>
                      <textarea maxLength={1000} placeholder="Comentario opcional (máximo 1000 caracteres)" value={reviewForm.comment} onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))} style={{ ...field, minHeight: 80 }} />
                      <button type="submit" disabled={reputationAction === 'review'} style={field}>{reputationAction === 'review' ? 'Enviando…' : 'Enviar valoración'}</button>
                    </form>

                    <form onSubmit={submitReputationReport} style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                      <h3 style={{ margin: 0 }}>Reportar conducta</h3>
                      <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                        Viaje relacionado
                        <select required value={reportForm.trip_id} onChange={(event) => setReportForm((current) => ({ ...current, trip_id: event.target.value, reported_profile_id: '' }))} style={field}>
                          <option value="">Selecciona un viaje</option>
                          {reputationData.reportable_trips.map((trip) => <option key={trip.trip_id} value={trip.trip_id}>{trip.route} · {trip.status === 'en-curso' ? 'En curso' : 'Completado'}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                        Persona reportada
                        <select required value={reportForm.reported_profile_id} onChange={(event) => setReportForm((current) => ({ ...current, reported_profile_id: event.target.value }))} style={field}>
                          <option value="">Selecciona a un participante</option>
                          {reputationData.reportable_trips.find((trip) => String(trip.trip_id) === reportForm.trip_id)?.participants
                            .map((participant) => <option key={participant.profile_id} value={participant.profile_id}>{participant.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                        Motivo
                        <select value={reportForm.category} onChange={(event) => setReportForm((current) => ({ ...current, category: event.target.value }))} style={field}>
                          <option value="safety">Seguridad</option>
                          <option value="harassment">Acoso</option>
                          <option value="no_show">No se presentó</option>
                          <option value="conduct">Conducta</option>
                          <option value="other">Otro</option>
                        </select>
                      </label>
                      <textarea required minLength={10} maxLength={1500} placeholder="Describe lo ocurrido (10–1500 caracteres)" value={reportForm.description} onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))} style={{ ...field, minHeight: 80 }} />
                      <button type="submit" disabled={reputationAction === 'report'} style={field}>{reputationAction === 'report' ? 'Enviando…' : 'Enviar reporte privado'}</button>
                    </form>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 24 }}>
                    <div>
                      <h3>Valoraciones recibidas</h3>
                      {reputationData.received_reviews.length
                        ? reputationData.received_reviews.map((review) => (
                          <article key={review.id} style={{ border: '1px solid rgba(196,181,253,.25)', borderRadius: 12, padding: 12, marginTop: 10 }}>
                            <strong>{review.rating}/5 · {review.reviewer || 'Participante verificado'}</strong>
                            <div style={{ color: '#cbd5e1', marginTop: 6 }}>{review.comment || 'Sin comentario.'}</div>
                            <small style={{ color: '#94a3b8' }}>{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</small>
                          </article>
                        ))
                        : <p style={{ color: '#94a3b8' }}>Aún no hay valoraciones verificadas.</p>}
                    </div>
                    <div>
                      <h3>Mis reportes</h3>
                      {reputationData.reports.length
                        ? reputationData.reports.map((report) => (
                          <article key={report.id} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 12, marginTop: 10 }}>
                            <strong>{report.category} · {report.status}</strong>
                            {report.resolution_note && <div style={{ color: '#cbd5e1', marginTop: 6 }}>{report.resolution_note}</div>}
                          </article>
                        ))
                        : <p style={{ color: '#94a3b8' }}>No has enviado reportes.</p>}
                    </div>
                  </div>
                  {!reputationData.completed_trips.length && !reputationData.reportable_trips.length && <p style={{ color: '#94a3b8', marginTop: 20 }}>Las valoraciones y reportes se habilitan para participantes de viajes registrados.</p>}
                </>
              )}

              {authUser?.role === 'admin' && (
                <div style={{ marginTop: 20 }}>
                  <h3>Reportes pendientes de moderación</h3>
                  {adminReports.length
                    ? adminReports.map((report) => (
                      <article key={report.id} style={{ border: '1px solid rgba(252,165,165,.25)', borderRadius: 12, padding: 14, marginTop: 10 }}>
                        <strong>{report.category} · {report.reporter} reporta a {report.reported}</strong>
                        <div style={{ color: '#cbd5e1', marginTop: 8 }}>{report.description}</div>
                        <small style={{ color: '#94a3b8' }}>{report.route}</small>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {[
                            ['reviewed', 'Marcar revisado'],
                            ['actioned', 'Tomar acción'],
                            ['dismissed', 'Descartar'],
                          ].map(([status, label]) => (
                            <button key={status} type="button" disabled={reputationAction === `report-${report.id}`} onClick={() => moderateReputationReport(report.id, status)} style={field}>{label}</button>
                          ))}
                        </div>
                      </article>
                    ))
                    : <p style={{ color: '#94a3b8' }}>No hay reportes abiertos.</p>}
                  {adminReportsMeta.total > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14, color: '#94a3b8', fontSize: 12 }}>
                      <span>{adminReportsMeta.total} reportes abiertos · página {adminReportsMeta.current_page} de {adminReportsMeta.last_page}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" disabled={adminReportsMeta.current_page <= 1} onClick={() => setAdminReportsPage(adminReportsMeta.current_page - 1)} style={field}>Anterior</button>
                        <button type="button" disabled={adminReportsMeta.current_page >= adminReportsMeta.last_page} onClick={() => setAdminReportsPage(adminReportsMeta.current_page + 1)} style={field}>Siguiente</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 20, marginBottom: 0 }}>
                Solo participantes de un viaje completado pueden valorarse una vez por viaje. Los comentarios se muestran al destinatario; los reportes son privados y solo los modera administración.
              </p>
            </div>
          </section>
        )}

        {active === 'payments' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#5eead4', fontWeight: 800 }}>MÓDULO 9</div>
              <h2 style={{ margin: '10px 0 12px', fontSize: 34 }}>Cotización y registro manual de seguros</h2>
              <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.6 }}>
                No se confirmó una póliza integral ni un precio público que reúna salud, vida y hurto. Los productos son candidatos para cotizar; la prima debe ser de máximo {formatInsurancePremium(insuranceMonthlyBudget)} al mes. ViajaU no activa cobertura por solicitar una cotización ni por subir un documento: administración debe verificar la póliza.
              </p>
              {authUser?.role === 'student' && membershipInfo?.data && (
                <div style={{ marginBottom: 20, background: 'rgba(45,212,191,.06)', border: '1px solid rgba(45,212,191,.2)', borderRadius: 14, padding: 16 }}>
                  <strong>Membresía de ViajaU</strong>
                  <p style={{ color: '#cbd5e1', margin: '8px 0' }}>{membershipInfo.message}</p>
                  <p style={{ color: '#cbd5e1', margin: 0 }}>
                    {membershipInfo.data.status === 'free_trial'
                      ? `Periodo gratuito: ${membershipInfo.data.trial_starts_at} a ${membershipInfo.data.trial_ends_at} (${membershipInfo.data.days_remaining} días restantes).`
                      : `Periodo gratuito finalizado el ${membershipInfo.data.trial_ends_at}. Precio previsto: ${formatInsurancePremium(membershipInfo.data.monthly_price_cop)} / mes.`}
                  </p>
                  {membershipInfo.data.latest_sandbox_payment && (
                    <p role="status" style={{ color: '#fbbf24', marginBottom: 0 }}>
                      Última prueba sandbox: {membershipPaymentStatusLabel(membershipInfo.data.latest_sandbox_payment.status)}. No activa la membresía.
                    </p>
                  )}
                  {membershipInfo.data.status === 'awaiting_payment_provider' && membershipInfo.data.wompi_sandbox_enabled && (
                    <button
                      type="button"
                      disabled={insuranceAction === 'membership-checkout'}
                      onClick={openWompiMembershipCheckout}
                      style={{ ...field, marginTop: 12 }}
                    >
                      {insuranceAction === 'membership-checkout' ? 'Abriendo sandbox…' : 'Probar pago sandbox con Wompi · COP $9.000'}
                    </button>
                  )}
                  {membershipInfo.data.status === 'awaiting_payment_provider' && !membershipInfo.data.wompi_sandbox_enabled && (
                    <p style={{ color: '#94a3b8', marginBottom: 0 }}>Las pruebas de pago sandbox aún no tienen llaves configuradas. No se realizará ningún cobro.</p>
                  )}
                </div>
              )}
              {insuranceError && <p role="alert" style={{ color: '#fca5a5' }}>{insuranceError}</p>}
              {insuranceLoading && <p role="status" style={{ color: '#cbd5e1' }}>Cargando información de seguros…</p>}

              {authUser?.role === 'student' && (
                <>
                  <h3 style={{ margin: '24px 0 12px' }}>Productos candidatos · todos requieren cotización</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                    {insuranceProducts.map((product) => {
                      const hasOpenRequest = myInsuranceEnrollments.some((item) => (
                        item.product_key === product.key
                        && ['quote_requested', 'quoted', 'pending_review', 'active'].includes(item.status)
                      ));
                      return (
                        <article key={product.key} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 16 }}>
                          <strong>{product.provider} · {product.name}</strong>
                          <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>{product.coverage_summary}</p>
                          <a href={product.source_url} target="_blank" rel="noreferrer" style={{ color: '#5eead4', fontSize: 13 }}>Ver información del proveedor</a>
                          <p style={{ color: '#fbbf24', fontSize: 13 }}>Precio: por cotizar · presupuesto máximo {formatInsurancePremium(product.monthly_budget_cop)} / mes · sin cobertura confirmada</p>
                          <button
                            type="button"
                            disabled={hasOpenRequest || insuranceAction === `quote-${product.key}`}
                            onClick={() => submitInsuranceQuoteRequest(product.key)}
                            style={field}
                          >
                            {hasOpenRequest ? 'Solicitud en curso' : insuranceAction === `quote-${product.key}` ? 'Enviando…' : 'Solicitar cotización'}
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  <h3 style={{ margin: '28px 0 12px' }}>Mis solicitudes y pólizas</h3>
                  {!myInsuranceEnrollments.length && !insuranceLoading && <p style={{ color: '#94a3b8' }}>Aún no tienes solicitudes de seguro.</p>}
                  <div style={{ display: 'grid', gap: 12 }}>
                    {myInsuranceEnrollments.map((enrollment) => (
                      <article key={enrollment.id} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 16 }}>
                        <strong>{enrollment.provider} · {enrollment.product_name}</strong>
                        <p style={{ color: '#5eead4', margin: '8px 0' }}>Estado: {insuranceStatusLabel(enrollment.status)}</p>
                        {enrollment.monthly_premium_cop != null && (
                          <p>Prima cotizada: {formatInsurancePremium(enrollment.monthly_premium_cop)} / mes</p>
                        )}
                        {enrollment.coverage_summary && <p style={{ color: '#cbd5e1' }}>{enrollment.coverage_summary}</p>}
                        {enrollment.review_note && <p role="note" style={{ color: '#fbbf24' }}>Nota administrativa: {enrollment.review_note}</p>}
                        {enrollment.status === 'quoted' && enrollment.monthly_premium_cop <= insuranceMonthlyBudget && (
                          <form onSubmit={(event) => submitInsurancePolicyForm(event, enrollment.id)} style={{ display: 'grid', gap: 10, maxWidth: 560, marginTop: 14 }}>
                            <label style={{ display: 'grid', gap: 6 }}>Número de póliza
                              <input name="policy_number" required maxLength={120} style={field} />
                            </label>
                            <label style={{ display: 'grid', gap: 6 }}>Inicio de cobertura
                              <input name="coverage_starts_at" type="date" required style={field} />
                            </label>
                            <label style={{ display: 'grid', gap: 6 }}>Fin de cobertura
                              <input name="coverage_ends_at" type="date" required style={field} />
                            </label>
                            <label style={{ display: 'grid', gap: 6 }}>Documento PDF de la póliza (máx. 5 MB)
                              <input name="policy_document" type="file" accept="application/pdf,.pdf" required style={field} />
                            </label>
                            <button type="submit" disabled={insuranceAction === `policy-${enrollment.id}`} style={field}>
                              {insuranceAction === `policy-${enrollment.id}` ? 'Enviando…' : 'Enviar póliza para verificación'}
                            </button>
                          </form>
                        )}
                        {enrollment.status === 'quoted' && enrollment.monthly_premium_cop > insuranceMonthlyBudget && (
                          <p role="alert" style={{ color: '#fca5a5' }}>Esta cotización excede el presupuesto de {formatInsurancePremium(insuranceMonthlyBudget)}/mes y no puede registrarse como cobertura.</p>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}

              {authUser?.role === 'admin' && (
                <>
                  <h3 style={{ margin: '24px 0 12px' }}>Revisión administrativa</h3>
                  {!adminInsuranceEnrollments.length && !insuranceLoading && <p style={{ color: '#94a3b8' }}>No hay solicitudes de seguro para revisar.</p>}
                  <div style={{ display: 'grid', gap: 12 }}>
                    {adminInsuranceEnrollments.map((enrollment) => (
                      <article key={enrollment.id} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 16 }}>
                        <strong>{enrollment.provider} · {enrollment.product_name}</strong>
                        <p style={{ color: '#cbd5e1' }}>Estudiante: {enrollment.user} · {enrollment.email}</p>
                        <p style={{ color: '#5eead4' }}>Estado: {insuranceStatusLabel(enrollment.status)}</p>
                        {enrollment.monthly_premium_cop != null && <p>Prima: {formatInsurancePremium(enrollment.monthly_premium_cop)} / mes</p>}
                        {enrollment.coverage_summary && <p>{enrollment.coverage_summary}</p>}
                        {enrollment.policy_number && <p>Póliza: {enrollment.policy_number} · Vigencia: {enrollment.coverage_starts_at} a {enrollment.coverage_ends_at}</p>}
                        {enrollment.review_note && <p role="note">Nota: {enrollment.review_note}</p>}
                        {enrollment.status === 'quote_requested' && (
                          <>
                            <form onSubmit={(event) => submitAdminInsuranceQuote(event, enrollment.id)} style={{ display: 'grid', gap: 10, maxWidth: 600 }}>
                              <label style={{ display: 'grid', gap: 6 }}>Prima mensual cotizada (COP)
                                <input name="monthly_premium_cop" type="number" min="1" max="1000000" required style={field} />
                              </label>
                              <label style={{ display: 'grid', gap: 6 }}>Coberturas y condiciones confirmadas por el proveedor
                                <textarea name="coverage_summary" minLength={10} maxLength={2000} required style={{ ...field, minHeight: 90 }} />
                              </label>
                              <button type="submit" disabled={insuranceAction === `admin-${enrollment.id}`} style={field}>Registrar cotización verificada</button>
                            </form>
                            <button type="button" disabled={insuranceAction === `admin-${enrollment.id}`} onClick={() => moderateInsuranceEnrollment(enrollment.id, 'rejected')} style={{ ...field, marginTop: 8 }}>Rechazar solicitud con motivo</button>
                          </>
                        )}
                        {enrollment.status === 'quoted' && (
                          <button type="button" disabled={insuranceAction === `admin-${enrollment.id}`} onClick={() => moderateInsuranceEnrollment(enrollment.id, 'rejected')} style={{ ...field, marginTop: 8 }}>Rechazar cotización con motivo</button>
                        )}
                        {enrollment.status === 'pending_review' && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {enrollment.has_policy_document && <button type="button" disabled={insuranceAction === `download-${enrollment.id}`} onClick={() => downloadInsurancePolicy(enrollment.id)} style={field}>Descargar póliza</button>}
                            <button type="button" disabled={insuranceAction === `admin-${enrollment.id}`} onClick={() => moderateInsuranceEnrollment(enrollment.id, 'active')} style={field}>Validar y activar póliza</button>
                            <button type="button" disabled={insuranceAction === `admin-${enrollment.id}`} onClick={() => moderateInsuranceEnrollment(enrollment.id, 'rejected')} style={field}>Rechazar con motivo</button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}
              {!['student', 'admin'].includes(authUser?.role) && (
                <p role="status" style={{ color: '#fbbf24' }}>Inicia sesión como estudiante verificado o administrador para usar este flujo.</p>
              )}
            </div>
          </section>
        )}

        {active === 'dashboard' && (
          <section style={{ display: 'grid', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#f472b6', fontWeight: 800 }}>MÓDULO 10</div>
              <h2 style={{ margin: '10px 0 8px', fontSize: 34 }}>Dashboard e historial de viajes</h2>
              <p style={{ marginTop: 0, color: '#cbd5e1' }}>Resumen basado en tus ofertas, solicitudes y valoraciones registradas. Las ofertas no tienen una fecha de salida; por eso no se presentan como viajes próximos.</p>
              {dashboardError && <p role="alert" style={{ color: '#fca5a5' }}>{dashboardError}</p>}
              {dashboardLoading && <p role="status" style={{ color: '#cbd5e1' }}>Actualizando tu resumen…</p>}
              {authUser?.role !== 'student' && <p role="status" style={{ color: '#fbbf24' }}>El dashboard personal y el chat de viajes están disponibles para estudiantes.</p>}
              {authUser?.role === 'student' && (
                <>
                  {(() => {
                    const ownedOffers = dashboardTrips.offers;
                    const outgoingRequests = dashboardTrips.requests;
                    const activeOffers = ownedOffers.filter((trip) => trip.status === 'oferta-activa');
                    const inProgress = ownedOffers.filter((trip) => trip.status === 'en-curso').length
                      + outgoingRequests.filter((request) => request.status === 'accepted' && request.offer.status === 'en-curso').length;
                    const completed = ownedOffers.filter((trip) => trip.status === 'completada').length
                      + outgoingRequests.filter((request) => request.status === 'accepted' && request.offer.status === 'completada').length;
                    const pendingRequests = ownedOffers.reduce((count, trip) => (
                      count + trip.requests.filter((request) => request.status === 'pending').length
                    ), 0) + outgoingRequests.filter((request) => request.status === 'pending').length;
                    const rating = dashboardReputation?.summary?.rating_average;
                    const ratingCount = dashboardReputation?.summary?.rating_count || 0;
                    const activity = [
                      ...ownedOffers.flatMap((trip) => trip.requests
                        .filter((request) => request.status === 'pending')
                        .map((request) => ({
                          key: `incoming-${request.id}`,
                          label: `Solicitud de cupo de ${request.requester.name}`,
                          detail: `${trip.origin} → ${trip.destination}`,
                        }))),
                      ...outgoingRequests
                        .filter((request) => ['accepted', 'rejected'].includes(request.status))
                        .map((request) => ({
                          key: `outgoing-${request.id}`,
                          label: `Tu solicitud fue ${tripStatusLabels[request.status] || request.status.toLowerCase()}`,
                          detail: `${request.offer.origin} → ${request.offer.destination}`,
                        })),
                    ];
                    const history = [
                      ...ownedOffers.map((trip) => ({
                        key: `offer-${trip.id}`,
                        route: `${trip.origin} → ${trip.destination}`,
                        status: trip.status,
                        detail: `Oferta como responsable · ${trip.departure_time}`,
                      })),
                      ...outgoingRequests.map((request) => ({
                        key: `request-${request.id}`,
                        route: `${request.offer.origin} → ${request.offer.destination}`,
                        status: request.offer.status === 'completada' ? 'completada' : request.status,
                        detail: `Solicitud como pasajero · ${request.offer.departure_time}`,
                      })),
                    ];
                    return (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 20 }}>
                          <Metric label="Ofertas activas" value={activeOffers.length} color="#f472b6" />
                          <Metric label="Viajes en curso" value={inProgress} color="#c084fc" />
                          <Metric label="Viajes completados" value={completed} color="#34d399" />
                          <Metric label="Solicitudes pendientes" value={pendingRequests} color="#fbbf24" />
                          <Metric label="Calificación" value={rating === null || rating === undefined ? 'Sin calificar' : `${rating}/5 (${ratingCount})`} color="#f9a8d4" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>
                          <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
                            <h3 style={{ marginTop: 0 }}>Actividad de viajes</h3>
                            {activity.length
                              ? <div style={{ display: 'grid', gap: 10 }}>{activity.slice(0, 10).map((item) => <div key={item.key} style={{ borderBottom: '1px solid rgba(148,163,184,.15)', paddingBottom: 8 }}><strong>{item.label}</strong><div style={{ color: '#94a3b8', fontSize: 13 }}>{item.detail}</div></div>)}</div>
                              : <p style={{ color: '#94a3b8' }}>No tienes solicitudes recientes pendientes de respuesta.</p>}
                            <button type="button" onClick={() => setActive('trips')} style={{ ...field, marginTop: 12 }}>Gestionar viajes</button>
                          </div>
                          <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
                            <h3 style={{ marginTop: 0 }}>Historial</h3>
                            {history.length
                              ? <div style={{ display: 'grid', gap: 10, maxHeight: 330, overflowY: 'auto' }}>{history.map((item) => <div key={item.key} style={{ borderBottom: '1px solid rgba(148,163,184,.15)', paddingBottom: 8 }}><strong>{item.route}</strong><div style={{ color: '#cbd5e1', fontSize: 13 }}>{item.detail} · {tripStatusLabels[item.status] || item.status}</div></div>)}</div>
                              : <p style={{ color: '#94a3b8' }}>Aún no hay viajes registrados en tu historial.</p>}
                            <button type="button" onClick={() => setActive('trust')} style={{ ...field, marginTop: 12 }}>Ver reputación y valoraciones</button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>

            {authUser?.role === 'student' && (
              <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#f9a8d4', fontWeight: 800 }}>COMUNICACIÓN PRIVADA POR VIAJE</div>
                <h3 style={{ margin: '8px 0 16px' }}>Chat con participantes aceptados</h3>
                {dashboardConversations.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, .7fr) minmax(0, 1.3fr)', gap: 16 }}>
                    <div style={{ display: 'grid', alignContent: 'start', gap: 8 }}>
                      {dashboardConversations.map((conversation) => (
                        <button
                          type="button"
                          key={conversation.id}
                          aria-pressed={selectedChatTripId === String(conversation.id)}
                          onClick={() => setSelectedChatTripId(String(conversation.id))}
                          style={{ ...field, textAlign: 'left', borderColor: selectedChatTripId === String(conversation.id) ? '#f472b6' : field.border }}
                        >
                          <strong>{conversation.origin} → {conversation.destination}</strong>
                          <span style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                            {conversation.participants.map((participant) => participant.name).join(', ')} · {conversation.message_count} mensajes
                          </span>
                        </button>
                      ))}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      {dashboardConversations.find((trip) => String(trip.id) === selectedChatTripId) && (
                        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
                          Participantes: {dashboardConversations.find((trip) => String(trip.id) === selectedChatTripId).participants.map((participant) => participant.name).join(', ')}
                        </div>
                      )}
                      {chatError && <p role="alert" style={{ color: '#fca5a5' }}>{chatError}</p>}
                      {chatLoading && !chatMessages.length && <p role="status" style={{ color: '#cbd5e1' }}>Cargando mensajes…</p>}
                      <div aria-live="polite" style={{ display: 'grid', gap: 8, maxHeight: 320, overflowY: 'auto', padding: 12, border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, background: 'rgba(2,6,23,.45)' }}>
                        {chatMessages.map((message) => (
                          <div key={message.id} style={{ justifySelf: message.is_mine ? 'end' : 'start', maxWidth: '85%', background: message.is_mine ? 'rgba(244,114,182,.16)' : 'rgba(148,163,184,.12)', padding: '8px 12px', borderRadius: 12 }}>
                            <strong style={{ fontSize: 12 }}>{message.is_mine ? 'Tú' : message.sender_name}</strong>
                            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.body}</div>
                            <time style={{ color: '#94a3b8', fontSize: 10 }}>{new Date(message.created_at).toLocaleString('es-CO')}</time>
                          </div>
                        ))}
                        {!chatMessages.length && !chatLoading && !chatError && <p style={{ color: '#94a3b8' }}>Aún no hay mensajes. Confirma con el grupo el punto de encuentro.</p>}
                      </div>
                      {chatReadOnly
                        ? <p role="status" style={{ color: '#fbbf24' }}>El viaje terminó; puedes consultar el historial, pero el chat está cerrado.</p>
                        : (
                          <form onSubmit={submitDashboardMessage} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <input
                              aria-label="Escribe un mensaje para el viaje"
                              value={chatDraft}
                              maxLength={2000}
                              onChange={(event) => setChatDraft(event.target.value)}
                              placeholder="Escribe al grupo del viaje…"
                              required
                              style={{ ...field, flex: 1, minWidth: 0 }}
                            />
                            <button type="submit" disabled={chatAction || !chatDraft.trim()} style={field}>
                              {chatAction ? 'Enviando…' : 'Enviar'}
                            </button>
                          </form>
                        )}
                      <p style={{ color: '#94a3b8', fontSize: 12 }}>Chat disponible únicamente para responsable y pasajeros aceptados. No compartas datos sensibles; el chat se cierra al cancelar o completar el viaje.</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8' }}>El chat aparecerá cuando tengas una oferta con pasajeros aceptados o participes como pasajero aceptado. Las notificaciones push y los mensajes fuera de la app no están habilitados.</p>
                )}
              </div>
            )}

            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>Checklist del módulo 10</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {dashboardChecklist.map((item) => (
                  <div key={item.label} style={{ color: item.done ? '#86efac' : '#fbbf24' }}>
                    {item.done ? '☑' : '☐'} {item.label}
                  </div>
                ))}
              </div>
              <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 0, marginTop: 12 }}>
                Las notificaciones externas se trabajan en el módulo 12. El chat actualiza el historial periódicamente; no es mensajería en tiempo real.
              </p>
            </div>
          </section>
        )}

        {active === 'privacy' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 11</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Privacidad y seguridad del backend</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                <Metric label='JWT activo' value='Sí' color='#38bdf8' />
                <Metric label='Sesiones' value='2.430' color='#7dd3fc' />
                <Metric label='Datos sensibles' value='Cifrados' color='#34d399' />
                <Metric label='Bloqueos' value='4' color='#fca5a5' />
              </div>
              <div style={{ marginTop: 20, background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.24)', borderRadius: 14, padding: 16, color: '#dbeafe' }}>
                Política de privacidad: ubicación exacta oculta, se comparte solo zona aproximada y el contacto de confianza solo recibe acceso autorizado por el usuario.
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>SEGURIDAD</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{privacyFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(56,189,248,.12)', color: '#dbeafe' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'alerts' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#f59e0b', fontWeight: 800 }}>MÓDULO 12</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Notificaciones y recordatorios</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {notifications.map((item, index) => (
                  <div key={item.title} style={{ background: item.active ? 'rgba(245,158,11,.08)' : 'rgba(148,163,184,.08)', border: `1px solid ${item.active ? 'rgba(245,158,11,.25)' : 'rgba(148,163,184,.25)'}`, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{item.title}</div>
                      <div style={{ color: '#dbeafe', fontSize: 12, marginTop: 4 }}>{item.channel}</div>
                    </div>
                    <button onClick={() => toggleNotification(index)} style={{ background: item.active ? 'rgba(245,158,11,.18)' : 'rgba(15,23,42,.9)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 10, color: '#fff', padding: '8px 12px', fontWeight: 700 }}>{item.active ? 'Desactivar' : 'Activar'}</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>ALERTAS</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{alertFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(245,158,11,.12)', color: '#fef3c7' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'advanced' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#a3e635', fontWeight: 800 }}>MÓDULO 13</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Funcionalidades avanzadas</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                <Metric label='Modo nocturno' value={advancedMode.night ? 'Activo' : 'Inactivo'} color='#a3e635' />
                <Metric label='Puntos seguros' value='17' color='#bef264' />
                <Metric label='Hotspots' value='5' color='#65a30d' />
                <Metric label='Uniones frecuentes' value='12' color='#4ade80' />
              </div>
              <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
                {Object.entries({
                  night: 'activarModoNocturno()',
                  safeties: 'sugerirRutasMasSeguras()',
                  hotspots: 'mostrarHotspotsDeViaje()',
                  recommendations: 'recomendarMejorHorario()',
                }).map(([key, value]) => (
                  <button key={key} onClick={() => toggleAdvancedFeature(key)} style={{ border: advancedMode[key] ? '1px solid rgba(163,230,53,.4)' : '1px solid rgba(148,163,184,.2)', background: advancedMode[key] ? 'rgba(163,230,53,.12)' : 'rgba(15,23,42,.8)', borderRadius: 12, padding: '12px 14px', color: '#fff', textAlign: 'left', fontWeight: 700 }}>
                    {value} • {advancedMode[key] ? 'ON' : 'OFF'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>INTELIGENCIA</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{advancedFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(163,230,53,.12)', color: '#ecfccb' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'backend' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fb7185', fontWeight: 800 }}>MÓDULO 14</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Infraestructura y backend</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                <Metric label='Cache rutas' value='Activo' color='#fda4af' />
                <Metric label='GTFS sync' value='OK' color='#fb7185' />
                <Metric label='Sistema' value='95.4%' color='#34d399' />
                <Metric label='Backups' value='Diarios' color='#fbbf24' />
              </div>
              <div style={{ marginTop: 20, background: 'rgba(251,113,133,.08)', border: '1px solid rgba(251,113,133,.22)', borderRadius: 14, padding: 16, color: '#ffe4e6' }}>
                El backend requiere manejo de caché, sincronización GTFS, colas de notificaciones, monitoreo de salud del sistema y logs de auditoría para crecer sin fallar.
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>CORE BACKEND</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{backendFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(251,113,133,.12)', color: '#ffe4e6' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'checklist' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#f9a8d4', fontWeight: 800 }}>MÓDULO 15</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Checklist de cumplimiento ViajaU</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                {completionAreas.map((area) => (
                  <div key={area.label} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div style={{ fontWeight: 800 }}>{area.label}</div>
                      <div style={{ color: '#f9a8d4', fontWeight: 800 }}>{area.progress}%</div>
                    </div>
                    <div style={{ marginTop: 12, height: 8, borderRadius: 999, background: 'rgba(148,163,184,.12)', overflow: 'hidden' }}>
                      <div style={{ width: `${area.progress}%`, height: '100%', background: 'linear-gradient(90deg, #f472b6, #f9a8d4)' }} />
                    </div>
                    <div style={{ marginTop: 10, color: '#86efac', fontSize: 12, fontWeight: 700 }}>{area.status}</div>
                    <div style={{ marginTop: 8, color: '#dbeafe', fontSize: 12 }}>{area.items}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>RESUMEN</div>
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                <div style={{ background: 'rgba(244,114,182,.09)', border: '1px solid rgba(244,114,182,.25)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800 }}>Cobertura funcional</div>
                  <div style={{ marginTop: 4, color: '#fbcfe8' }}>97% del producto central cubierto en la propuesta funcional.</div>
                </div>
                <div style={{ background: 'rgba(52,211,153,.09)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800 }}>MVP viable</div>
                  <div style={{ marginTop: 4, color: '#d1fae5' }}>Validación universitaria, matching por zona/horario, rutas, seguridad y dashboard completos.</div>
                </div>
                <div style={{ background: 'rgba(59,130,246,.09)', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800 }}>Pendientes reales</div>
                  <div style={{ marginTop: 4, color: '#dbeafe' }}>Escala, integración con APIs de producción, persistencia y automatización avanzada.</div>
                </div>
                <div style={{ background: 'rgba(245,158,11,.09)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800 }}>Checklist operativo</div>
                  <div style={{ marginTop: 4, color: '#fef3c7' }}>{completedTasks}/{executionState.length} tareas completadas del plan de ejecución.</div>
                </div>
              </div>
              <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                {executionState.map((task) => (
                  <button key={task.id} onClick={() => toggleExecutionTask(task.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: task.done ? 'rgba(52,211,153,.08)' : 'rgba(15,23,42,.7)', border: `1px solid ${task.done ? 'rgba(52,211,153,.35)' : 'rgba(148,163,184,.2)'}`, borderRadius: 12, padding: '12px 14px', color: '#fff', textAlign: 'left' }}>
                    <span>{task.label}</span>
                    <span style={{ fontWeight: 800, color: task.done ? '#86efac' : '#fbbf24' }}>{task.done ? 'OK' : 'PEND'}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {active === 'roadmap' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#67e8f9', fontWeight: 800 }}>MÓDULO 16</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Roadmap de implementación</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                {roadmapPhases.map((item) => (
                  <div key={item.phase} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 800 }}>{item.phase}</div>
                      <div style={{ color: '#67e8f9', fontWeight: 800 }}>{item.status}</div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800 }}>{item.title}</div>
                    <div style={{ marginTop: 6, color: '#dbeafe' }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>OBJETIVO</div>
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                <div style={{ background: 'rgba(103,232,249,.08)', border: '1px solid rgba(103,232,249,.25)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800 }}>Prioridad real</div>
                  <div style={{ marginTop: 4, color: '#cffafe' }}>Alinear MVP con validación, rutas, matching y seguridad antes de escalar a monetización e infraestructura.</div>
                </div>
                <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800 }}>Criterio de éxito</div>
                  <div style={{ marginTop: 4, color: '#dcfce7' }}>Que la app pueda conectar estudiantes reales por barrio, horario y ruta con confianza y vigilancia mínima.</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      </>
     )}
   </div>
  );
}

function Panel({ title, value, color }) {
  return <div style={{ background: 'rgba(15,23,42,.8)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}><div style={{ color, fontWeight: 800, marginBottom: 4 }}>{title}</div><div style={{ color: '#dbeafe' }}>{value}</div></div>;
}

function Metric({ label, value, color }) {
  return <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.15)', borderRadius: 14, padding: 16 }}><div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div><div style={{ marginTop: 8, color, fontWeight: 800, fontSize: 24 }}>{value}</div></div>;
}
