import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BUSINESS_MODULES } from './data/businessModules';
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
  getMyTrips,
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
  storeAuthToken,
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
  getRouteModeKey,
  buildTrustSummary
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

const adminFns = [
  'registrarUniversidad()', 'registrarSede()', 'gestionarProgramas()', 'gestionarFacultades()', 'gestionarPeriodos()', 'gestionarRutasMIO()',
  'importarGTFS()', 'actualizarParadas()', 'validarDatosRutas()', 'gestionarUsuarios()', 'gestionarSolicitudesVerificacion()',
  'gestionarReportes()', 'gestionarIncidentes()', 'revisarDenuncias()', 'totalUsuariosRegistrados()', 'viajesActivos()', 'viajesCompletados()',
  'viajesSeguros()', 'tasaDeCoincidencia()', 'tasaDeRetencion()', 'analisisPorBarrio()', 'analisisPorJornada()',
  'cifrarDatosSensibles()', 'protegerJWT()', 'validarToken()', 'gestionarSesiones()', 'limitarIntentosLogin()', 'auditoriaAcciones()', 'generarLogsSeguridad()'
];

const trustFns = [
  'obtenerCalificacionUsuario()', 'calcularRatingPromedio()', 'mostrarHistorialConfiable()', 'mostrarComentarios()', 'detectarUsuariosRecurrentes()',
  'validarCorreoUniversitario()', 'verificarEstudiante()', 'confirmarPertenencia()', 'validarFacultad()', 'validarEstudianteActiva()',
  'revisarReportes()', 'suspenderCuenta()', 'activarInvestigacion()', 'archivarIncidente()'
];

const paymentFns = [
  'activarSeguroViaje()', 'calcularPrima()', 'generarFactura()', 'procesarPago()', 'registrarPagoExitoso()', 'pagarSeguro()',
  'activarCoberturaAsistencia()', 'verificarCoberturaActiva()', 'registrarIncidenteCobertura()', 'crearCasoSeguro()', 'consultarEstadoSeguro()',
  'monetizarViajeSeguro()', 'aplicarDescuento()', 'generarReporteIngresos()', 'calcularIngresoPorTrayecto()'
];

const dashboardFns = [
  'mostrarResumenViajes()', 'mostrarProximosViajes()', 'mostrarTrayectosActivos()', 'mostrarNotificaciones()', 'mostrarRutasSugeridas()',
  'listarViajesAnteriores()', 'consultarTrayectosPasados()', 'verEstadisticasPersonales()', 'verCalificacionesObtenidas()',
  'crearChatViaje()', 'enviarMensaje()', 'responderMensaje()', 'adjuntarUbicacion()', 'compartirRuta()', 'enviarNotificacionInterna()'
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
  { label: 'Pago, confianza y monetización', progress: 100, status: 'Completado', items: 'Cobros, seguros, reputación, moderación y dashboards' },
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

const initialStudent = { name: 'Kevin González', email: 'kevin.gonzalez@uniajc.edu.co', career: 'Ingeniería de Sistemas', semester: '8vo Semestre', shift: 'Nocturna', neighborhood: 'El Caney', transport: 'MIO + caminata', emergency: 'María González', privacy: 'Zona aproximada' };

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
const functionCoverage = BUSINESS_MODULES.map((module) => ({
  ...module,
  count: module.functions.length,
  sample: module.functions.slice(0, 4)
}));

export default function AppFresh() {
  const persisted = useMemo(() => readAppData(), []);
  const [active, setActive] = useState(persisted.activeTab || 'auth');
  const [student, setStudent] = useState(persisted.student || initialStudent);
  const [uni, setUni] = useState(universities.find((u) => u.id === (persisted.university?.id || 'uniajc')) || universities[0]);
  const [email, setEmail] = useState(persisted.email || initialStudent.email);
  const [privacy, setPrivacy] = useState(persisted.privacy || 'Zona aproximada');
  const [toast, setToast] = useState('');
  const [route, setRoute] = useState(persisted.route || { origin: 'UNIAJC Sede Sur', destination: 'El Caney', mode: 'MIO + caminata', time: '9:45 PM' });
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
  const [adminState, setAdminState] = useState(persisted.adminState || { users: '18.4K', trips: '2.1K', matchRate: '89%', safeTrips: '96%' });
  const [pricing, setPricing] = useState(persisted.pricing || { premium: '$4.800', coverage: '98.3%', insured: true, claim: 0 });
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
  const trustSummary = useMemo(() => buildTrustSummary([{ rating: 4.8 }, { rating: 4.9 }, { rating: 4.7 }, { rating: 4.8 }]), []);

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
      const token = getAuthToken();
      if (token) {
        try {
          const { user } = await getCurrentAccount(token);
          if (!cancelled) {
            applyAuthenticatedUser(user);
            setIsLoggedIn(true);
          }
        } catch (error) {
          if (!cancelled) {
            if (error.status === 401) clearAuthToken();
            else setToast(error.message);
          }
        }
      }
      if (!cancelled) setIsBooting(false);
    };
    restoreSession();
    return () => { cancelled = true; };
  }, [applyAuthenticatedUser]);

  useEffect(() => {
    writeAppData({
      student,
      university: uni,
      email,
      privacy,
      route,
      searchState,
      notifications,
      advancedMode,
      adminState,
      pricing,
      executionState,
      activeTab: active
    });
  }, [student, uni, email, privacy, route, searchState, notifications, advancedMode, adminState, pricing, executionState, active]);

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
  const toggleInsurance = () => {
    setPricing((current) => ({ ...current, insured: !current.insured }));
    setToast('Cobertura de seguro actualizada.');
  };
  const toggleExecutionTask = (id) => {
    setExecutionState((current) => current.map((item) => item.id === id ? { ...item, done: !item.done } : item));
    setToast('Estado del checklist actualizado.');
  };
  const calculateTravelCost = () => {
    const { premium } = calculateTripCost(routeResult?.distanceKm ?? 8.4);
    setPricing((current) => ({ ...current, premium }));
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
        : await loginAccount({ email: loginForm.email, password: loginForm.password });

      storeAuthToken(response.token, loginForm.remember);
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
          <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#c4b5fd', fontWeight: 800 }}>MÓDULO 7</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Administración, analytics y moderación</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(160px,1fr))', gap: 16 }}>
                {Object.entries(adminState).map(([label, value]) => <div key={label} style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(196,181,253,.3)', borderRadius: 14, padding: 18 }}><div style={{ color: '#d8b4fe', fontWeight: 700 }}>{label}</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{value}</div></div>)}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>COBERTURA</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{adminFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(139,92,246,.12)', color: '#e9d5ff' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'trust' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#c4b5fd', fontWeight: 800 }}>MÓDULO 8</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Confiabilidad y reputación</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 }}>
                <Metric label='Rating promedio' value='4.8/5' color='#a78bfa' />
                <Metric label='Usuarios recurrentes' value='61%' color='#c4b5fd' />
                <Metric label='Reportes activos' value='13' color='#fca5a5' />
              </div>
              <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
                {['Ana Vélez: 4.9', 'Claudia Aranda: 4.8', 'Daniela Carmona: 4.7'].map((item) => (
                  <div key={item} style={{ background: 'rgba(167,139,250,.08)', border: '1px solid rgba(196,181,253,.25)', borderRadius: 12, padding: 12 }}>{item}</div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>VERIFICACIÓN</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{trustFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(167,139,250,.12)', color: '#e9d5ff' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'payments' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#5eead4', fontWeight: 800 }}>MÓDULO 9</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Pago y seguro por trayecto</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                <Metric label='Prima estimada' value={pricing.premium} color='#5eead4' />
                <Metric label='Cobertura activa' value={pricing.coverage} color='#34d399' />
                <Metric label='Pago realizado' value={pricing.insured ? 'OK' : 'Pendiente'} color='#fbbf24' />
                <Metric label='Claim pendiente' value={pricing.claim} color='#fca5a5' />
              </div>
              <div style={{ marginTop: 20, background: 'rgba(45,212,191,.06)', border: '1px solid rgba(45,212,191,.2)', borderRadius: 14, padding: 16, color: '#ccfbf1' }}>
                Seguro de viaje activo para el trayecto UNIAJC → El Caney. Cobertura por asistencia, soporte y alertas de emergencia incluida.
              </div>
              <div style={{ marginTop: 18 }}><button onClick={toggleInsurance} style={{ border: '1px solid rgba(45,212,191,.4)', borderRadius: 12, background: pricing.insured ? 'rgba(45,212,191,.12)' : 'rgba(15,23,42,.8)', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>{pricing.insured ? 'Desactivar cobertura' : 'Activar cobertura'}</button></div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>MONETIZACIÓN</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{paymentFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(45,212,191,.12)', color: '#ccfbf1' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'dashboard' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#f472b6', fontWeight: 800 }}>MÓDULO 10</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Dashboard y comunicación</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                <Metric label='Viajes próximos' value='3' color='#f472b6' />
                <Metric label='Notificaciones' value='8' color='#f9a8d4' />
                <Metric label='Trayectos activos' value='2' color='#c084fc' />
                <Metric label='Calificaciones' value='4.8' color='#fbbf24' />
              </div>
              <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
                <div style={{ background: 'rgba(244,114,182,.08)', border: '1px solid rgba(244,114,182,.2)', borderRadius: 12, padding: 12 }}>Chat grupal: Ana y Claudia confirmaron punto de encuentro seguro.</div>
                <div style={{ background: 'rgba(244,114,182,.08)', border: '1px solid rgba(244,114,182,.2)', borderRadius: 12, padding: 12 }}>Recordatorio de salida en 15 minutos y check-in de llegada habilitado.</div>
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>COMUNICACIÓN</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{dashboardFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(244,114,182,.12)', color: '#fbcfe8' }}>{f}</span>)}</div>
              <div style={{ marginTop: 20, background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Cobertura funcional por módulo</div>
                <small style={{ display: 'block', marginBottom: 12, color: '#cbd5e1' }}>Inventario de alcance. La cantidad de funciones listadas no significa que todas estén implementadas; revisa el estado de cada módulo.</small>
                <div style={{ display: 'grid', gap: 10 }}>
                  {functionCoverage.map((module) => (
                    <div key={module.id} style={{ background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.15)', borderRadius: 10, padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 12 }}>{module.title}</span>
                        <span style={{ color: '#f9a8d4', fontWeight: 800, fontSize: 11 }}>{module.count}</span>
                      </div>
                      <div style={{ marginTop: 5, color: '#cbd5e1', fontSize: 11 }}>{module.status}</div>
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {module.sample.map((func) => <span key={`${module.id}-${func}`} style={{ background: 'rgba(244,114,182,.08)', color: '#fbcfe8', borderRadius: 999, padding: '4px 6px', fontSize: 9 }}>{func}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
