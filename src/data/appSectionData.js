export const privacyFunctions = [
  'cifrarDatosSensibles()', 'protegerJWT()', 'validarToken()', 'gestionarSesiones()', 'limitarIntentosLogin()', 'auditoriaAcciones()', 'generarLogsSeguridad()',
  'ocultarUbicacionExacta()', 'compartirSoloZona()', 'activarModoPrivacidad()', 'limitarAccesoDeContacto()', 'borrarDatosSolicitados()',
];

export const alertFunctions = [
  'recordatorioViajeProximo()', 'recordatorioCheckIn()', 'recordatorioLlegada()', 'recordatorioSeguro()', 'alertaHoraSalida()',
  'alertaCambioRuta()', 'alertaViajeCancelado()', 'alertaContactoDeConfianza()', 'notificarNuevoMatch()', 'notificarCambioHorario()',
  'notificarLlegada()', 'notificarCancelacion()', 'enviarAlertaSeguridad()', 'enviarPush()', 'enviarCorreo()', 'enviarWhatsAppoSMS()',
];

export const searchFunctions = [
  'buscarViajesPorZona()', 'buscarViajesPorHora()', 'buscarViajesPorUniversidad()', 'buscarViajesPorFacultad()',
  'filtrarPorTransporte()', 'filtrarPorVerificacionInstitucional()',
  'ordenarPorCompatibilidad()', 'ordenarPorHora()', 'ordenarPorFecha()',
];

export const authFunctions = [
  'registrarUsuario()', 'validarCorreoInstitucional()', 'confirmarDominioUniversitario()', 'verificarIdentidad()', 'crearPerfilEstudiante()',
  'actualizarPerfil()', 'guardarBarrioResidencia()', 'guardarCoordenadasZona()', 'seleccionarFacultadPrograma()', 'seleccionarJornadaAcademica()',
  'definirModoTransporteHabitual()', 'definirHorariosDeSalida()', 'definirContactoDeConfianza()', 'guardarPreferenciasViaje()',
  'activarCompartirUbicación()', 'definirNivelDePrivacidad()', 'activarNotificacionesSeguridad()', 'configurarEmergencia()',
];

export const matchFunctions = [
  'consultarOfertasVerificadas()', 'compararZonaDeclarada()', 'compararJornadaConHora()',
  'compararTransportePreferido()', 'explicarPuntajeCoincidencia()', 'ordenarRecomendaciones()',
];

export const advancedFunctions = [
  'activarModoNocturno()', 'sugerirRutasMasSeguras()', 'priorizarTrayectosNocturnos()', 'recomendarMejorHorario()', 'detectarPatronesDeViaje()',
  'sugerirUnionesFrecuentes()', 'sugerirPuntosSeguros()', 'mostrarZonaDeRiesgo()', 'mostrarPuntosSeguros()', 'mostrarRutasFrecuentes()',
  'mostrarHotspotsDeViaje()', 'subirDatosEstudiantes()', 'sincronizarHorarios()', 'integrarCalendario()', 'validarJornadaAcademica()',
];

export const backendFunctions = [
  'createStudent()', 'updateStudentProfile()', 'validateInstitutionalEmail()', 'findTravelMatches()', 'createTravelOffer()', 'joinTravel()',
  'approveTravelParticipant()', 'startTrip()', 'trackLiveLocation()', 'sendEmergencyAlert()', 'completeTrip()', 'rateUser()', 'reportUser()',
  'processTripPayment()', 'activateTripInsurance()', 'generateTripSummary()', 'generateAnalytics()', 'moderateReports()',
  'fetchRoadNetwork()', 'fetchGTFSStops()', 'fetchRouteLines()', 'buildRouteGraph()', 'detectNearestStop()', 'getTravelTimeByMode()',
  'estimateRouteCost()', 'findMeetingPoint()', 'matchRouteToCampus()', 'mapStudentZoneToRoute()', 'computeInsurancePremium()',
  'activateInsuranceFlow()', 'verifyEligibleTrip()', 'saveInsurancePolicy()', 'monitorTripCoverage()', 'triggerCoverageAlert()', 'issueClaim()',
  'generateInsuranceReport()', 'cacheRouteData()', 'syncTransitData()', 'retryFailedRequest()', 'handleQueueNotifications()', 'monitorSystemHealth()',
  'archiveOldTrips()', 'purgeExpiredSessions()', 'backupDatabase()', 'exportAnalytics()', 'createSystemLogs()',
];

export const completionAreas = [
  { label: 'Usuarios y validación', status: 'Parcial', items: 'Registro, inicio de sesión, verificación de correo, perfiles y roles; no acredita identidad real.' },
  { label: 'Mapas, rutas y búsqueda', status: 'Parcial', items: 'Mapa, proveedores externos de rutas y búsqueda; GTFS no incluye horarios completos ni garantiza disponibilidad externa.' },
  { label: 'Gestión de viajes y seguridad', status: 'Parcial', items: 'Ofertas, SOS y GPS consentido; la geocerca automática espera verificación de ruta en servidor y no hay respuesta automática de autoridades.' },
  { label: 'Pago, confianza y monetización', status: 'Parcial', items: 'Reputación, cotizaciones y revisión manual; pagos reales y activación automática de seguro no están habilitados.' },
  { label: 'Infraestructura avanzada', status: 'En desarrollo', items: 'Hay controles y pruebas, pero no existe evidencia de certificación de producción, monitoreo externo ni disponibilidad operativa de colas/scheduler.' },
];

export const roadmapPhases = [
  { phase: 'Fase 1 - MVP', title: 'Validación + matching + seguridad', detail: 'Permitir registro institucional, afinidad por zona/horario, recomendaciones y geolocalización segura.', status: 'Activo' },
  { phase: 'Fase 2 - Operación', title: 'Viajes + pagos + notificaciones', detail: 'Publicación de viajes, cobro por trayecto, recordatorios y seguimiento de llegada.', status: 'Siguiente' },
  { phase: 'Fase 3 - Crecimiento', title: 'Confianza + analytics + administración', detail: 'Reputación, reportes, panel administrativo y métricas de negocio.', status: 'Planeado' },
  { phase: 'Fase 4 - Escala', title: 'Integraciones reales y backend productivo', detail: 'GTFS real, mapas externos, persistencia, colas, observabilidad y seguridad de producción.', status: 'Futuro' },
];

export const executionChecklist = [
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

export const dashboardChecklist = [
  { label: 'Resumen de ofertas, viajes, solicitudes y reputación con datos reales', done: true },
  { label: 'Historial de ofertas y participaciones registradas', done: true },
  { label: 'Chat persistente entre responsable y pasajeros aceptados', done: true },
  { label: 'Cerrar el chat para nuevos mensajes al terminar el viaje', done: true },
  { label: 'Fecha del viaje para calcular próximos trayectos', done: false },
  { label: 'Notificaciones push y comunicación externa', done: false },
  { label: 'Compartir ubicación/ruta desde el chat', done: false },
];
