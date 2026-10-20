import React, { useMemo, useState } from 'react';

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
];

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

const routeFns = [
  'obtenerUbicacionActual()', 'obtenerUbicacionBarrio()', 'buscarZonaPorTexto()', 'geocodificarDireccion()', 'calcularDistanciaEntrePuntos()',
  'calcularRutaACaminando()', 'calcularRutaEnBici()', 'calcularRutaEnMoto()', 'calcularRutaEnCarro()', 'calcularRutaEnTaxi()',
  'calcularRutaEnMIO()', 'calcularRutaTransportePublico()', 'calcularRutaMixta()', 'calcularRutaCasaUniversidad()', 'calcularRutaUniversidadCasa()',
  'calcularRutaAParada()', 'calcularRutaAlPuntoEncuentro()', 'calcularTiempoEstimadoLlegada()', 'cargarGTFSMetroCali()', 'leerParadasMIO()',
  'leerRutasMIO()', 'mapearParadasCercanas()', 'detectarRutaCompatible()', 'construirItinerarioMultimodal()', 'calcularRutaConDatosAbiertos()', 'fallbackRouting()'
];

const searchFns = [
  'buscarViajesPorZona()', 'buscarViajesPorHora()', 'buscarViajesPorJornada()', 'buscarViajesPorUniversidad()', 'buscarViajesPorRuta()', 'buscarViajesPorFacultad()',
  'filtrarPorSexo()', 'filtrarPorConfianza()', 'filtrarPorTransporte()', 'filtrarPorSeguridad()',
  'ordenarPorDistancia()', 'ordenarPorTiempo()', 'ordenarPorCompatibilidad()'
];

const routingApis = ['OSRM', 'Nominatim', 'OpenStreetMap', 'OpenTripPlanner', 'Fallback routing'];

const matchFns = [
  'encontrarCompatiblesPorZona()', 'encontrarCompatiblesPorHorario()', 'encontrarCompatiblesPorRuta()', 'encontrarCompatiblesPorJornada()', 'encontrarCompatiblesPorFacultad()',
  'encontrarCompatiblesPorSector()', 'calcularPuntajeCoincidencia()', 'evaluarDistanciaZona()', 'evaluarTiempoSalida()', 'evaluarRutaCompatible()',
  'evaluarNivelDeConfianza()', 'evaluarSeguridad()', 'recomendarViaje()', 'sugerirPuntoEncuentro()', 'calcularPuntoMedio()', 'elegirParadaSegura()',
  'sugerirRutaDeAcercamiento()', 'validarPuntoSeguro()', 'crearGrupoViaje()', 'unirEstudianteAGrupo()', 'recomendarGrupo()', 'ajustarGrupoPorHora()', 'detectarViajeCombinado()'
];

const tripFns = [
  'crearOfertaViaje()', 'crearSolicitudViaje()', 'publicarDisponibilidad()', 'activarViajeEnTiempoReal()', 'confirmarTrayecto()',
  'aceptarPasajero()', 'rechazarPasajero()', 'invitarEstudiante()', 'dejarGrupo()', 'cancelarViaje()', 'cancelarParticipacion()',
  'iniciarViaje()', 'confirmarSalida()', 'confirmarLlegada()', 'marcarViajeCompletado()', 'marcarViajeEnCurso()', 'marcarViajeCancelado()',
  'calcularCostoEstimado()', 'dividirCosto()', 'establecerAportePorTrayecto()', 'pagarPorTrayecto()', 'registrarCobro()'
];

const safetyFns = [
  'compartirUbicacion()', 'actualizarUbicacion()', 'verUbicacionGrupo()', 'verRutaEnTiempoReal()', 'notificarCambioDeUbicacion()',
  'confirmarLlegadaSegura()', 'enviarRecordatorioLlegada()', 'activarCheckIn()', 'verificarLlegadaAlumno()', 'activarBotonPanico()',
  'enviarAlertaContacto()', 'enviarAlertaAutoridades()', 'pedirAyuda()', 'activarModoEmergencia()', 'compartirUbicacionConContacto()',
  'monitorearGeocerca()', 'detectarSalidaDeRuta()', 'detectarDesviacion()', 'detectarInactividad()', 'alertarViajeAnormal()',
  'valorarConductor()', 'valorarPasajero()', 'registrarIncidente()', 'reportarUsuario()', 'bloquearUsuario()', 'listarUsuariosBloqueados()'
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

const initialStudent = { name: 'Kevin González', email: 'kevin.gonzalez@uniajc.edu.co', career: 'Ingeniería de Sistemas', semester: '8vo Semestre', shift: 'Nocturna', neighborhood: 'El Caney', transport: 'MIO + caminata', emergency: 'María González', privacy: 'Zona aproximada' };

const matches = [
  { traveler: 'Ana Vélez', score: 96, zone: 'El Caney', time: '9:45 PM', mode: 'MIO + caminata' },
  { traveler: 'Daniela Carmona', score: 92, zone: 'Pance', time: '9:50 PM', mode: 'Moto segura' },
  { traveler: 'Santiago Rojas', score: 88, zone: 'Valle del Lili', time: '10:00 PM', mode: 'Carro compartido' },
];

const trips = [
  { driver: 'Claudia Aranda', route: 'UNIAJC → Pance', seats: 2, cost: '3500 COP', status: 'Verificado' },
  { driver: 'David Restrepo', route: 'Univalle → El Caney', seats: 1, cost: '3000 COP', status: 'Seguro activo' },
  { driver: 'Santiago Morales', route: 'UNIAJC → Capri', seats: 3, cost: '0 COP', status: 'Grupo seguro' },
];

const alerts = [
  { type: 'Geocerca', detail: 'Salida de ruta detectada en Pance', state: 'Monitoreando' },
  { type: 'Check-in', detail: 'Llegada segura confirmada por Ana', state: 'OK' },
  { type: 'Emergencia', detail: 'Alerta enviada a contacto de confianza', state: 'Activo' },
];

const kpis = [
  ['Usuarios registrados', '18.4K'], ['Viajes activos', '2.1K'], ['Tasa de coincidencia', '89%'], ['Viajes seguros', '96%']
];

const field = { padding: '12px 14px', borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', color: '#fff' };

export default function AppFresh() {
  const [active, setActive] = useState('auth');
  const [student, setStudent] = useState(initialStudent);
  const [uni, setUni] = useState(universities[0]);
  const [email, setEmail] = useState(initialStudent.email);
  const [privacy, setPrivacy] = useState('Zona aproximada');
  const [toast, setToast] = useState('');
  const [route, setRoute] = useState({ origin: 'UNIAJC Sede Sur', destination: 'El Caney', mode: 'MIO + caminata', time: '9:45 PM' });
  const [searchState, setSearchState] = useState({ zone: 'El Caney', time: '19:45', faculty: 'Ingeniería', transport: 'MIO', confidence: '4.8+', gender: 'Cualquiera', sort: 'Compatibilidad' });
  const [searchResults, setSearchResults] = useState([
    { name: 'Ana Vélez', zone: 'El Caney', time: '19:45', faculty: 'Ingeniería', transport: 'MIO + caminata', score: 96, safety: 'Alta' },
    { name: 'Daniela Carmona', zone: 'El Caney', time: '19:50', faculty: 'Ingeniería', transport: 'MIO', score: 92, safety: 'Alta' },
    { name: 'Santiago Rojas', zone: 'Pance', time: '20:10', faculty: 'Diseño', transport: 'Carro', score: 86, safety: 'Media' },
  ]);
  const [notifications, setNotifications] = useState([
    { title: 'Salida en 15 min', channel: 'Push', active: true },
    { title: 'Check-in de llegada pendiente', channel: 'SMS', active: true },
    { title: 'Cambio de ruta detectado', channel: 'Alerta', active: false },
    { title: 'Contacto de confianza notificado', channel: 'WhatsApp', active: true },
  ]);
  const [advancedMode, setAdvancedMode] = useState({ night: true, safeties: true, hotspots: true, recommendations: true });
  const [safetyState, setSafetyState] = useState({ panic: false, geofence: true, emergency: true, arrival: false });
  const [adminState, setAdminState] = useState({ users: '18.4K', trips: '2.1K', matchRate: '89%', safeTrips: '96%' });
  const [pricing, setPricing] = useState({ premium: '$4.800', coverage: '98.3%', insured: true, claim: 0 });

  const validEmail = useMemo(() => email.trim().toLowerCase().endsWith(uni.domain.toLowerCase()), [email, uni]);

  const summary = useMemo(() => {
    const mins = route.mode === 'Moto' ? 18 : route.mode === 'Carro' ? 24 : route.mode === 'Bicicleta' ? 30 : 35;
    return { duration: `${mins + (route.mode.includes('caminata') ? 12 : 0)} min`, distance: route.mode === 'Moto' ? '5.8 km' : route.mode === 'Carro' ? '7.1 km' : '6.4 km', safety: route.mode === 'Moto' ? '78/100' : '90/100' };
  }, [route]);

  const filteredResults = useMemo(() => {
    const normalized = [...searchResults].filter((item) => {
      const zoneMatch = !searchState.zone || item.zone.toLowerCase().includes(searchState.zone.toLowerCase());
      const timeMatch = !searchState.time || item.time.startsWith(searchState.time.slice(0, 2));
      const facultyMatch = !searchState.faculty || item.faculty.toLowerCase().includes(searchState.faculty.toLowerCase());
      const transportMatch = !searchState.transport || item.transport.toLowerCase().includes(searchState.transport.toLowerCase());
      const confidenceMatch = !searchState.confidence || Number(searchState.confidence.replace('+', '')) <= item.score;
      return zoneMatch && timeMatch && facultyMatch && transportMatch && confidenceMatch;
    });

    return [...normalized].sort((a, b) => {
      if (searchState.sort === 'Distancia') return a.score - b.score;
      if (searchState.sort === 'Tiempo') return a.time.localeCompare(b.time);
      return b.score - a.score;
    });
  }, [searchResults, searchState]);

  const register = () => {
    if (!validEmail) {
      setToast('Error: el correo no pertenece al dominio universitario seleccionado.');
      return;
    }
    setStudent({ ...student, email, privacy });
    setToast('Registro universitario validado correctamente y perfil creado.');
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
  const toggleSafetyFeature = (key) => {
    setSafetyState((current) => ({ ...current, [key]: !current[key] }));
    setToast('Estado de seguridad actualizado.');
  };
  const toggleInsurance = () => {
    setPricing((current) => ({ ...current, insured: !current.insured }));
    setToast('Cobertura de seguro actualizada.');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020b10', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ borderBottom: '1px solid rgba(148,163,184,.2)', padding: 18, position: 'sticky', top: 0, background: 'rgba(2,11,16,.75)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#86efac', fontWeight: 800 }}>VIAJAU</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Movilidad segura universitaria</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {modules.map((m) => (
              <button key={m.key} onClick={() => setActive(m.key)} style={{ border: active === m.key ? '1px solid rgba(52,211,153,.5)' : '1px solid rgba(148,163,184,.2)', background: active === m.key ? 'rgba(16,185,129,.12)' : 'rgba(10,15,20,.75)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 700 }}>
                {m.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 60px' }}>
        {toast && <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(52,211,153,.4)', borderRadius: 12, padding: '12px 14px', marginBottom: 18, color: '#d1fae5' }}>{toast}</div>}

        {active === 'auth' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#86efac', fontWeight: 800 }}>MÓDULO 1</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Autenticación y registro universitario</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}><span>Universidad</span><select value={uni.id} onChange={(e) => setUni(universities.find(u => u.id === e.target.value))} style={field}>{universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Correo institucional</span><input value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...field, borderColor: validEmail ? 'rgba(52,211,153,.5)' : 'rgba(239,68,68,.55)' }} /></label>
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
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ color: validEmail ? '#86efac' : '#fca5a5', fontWeight: 800 }}>Dominio requerido: {uni.domain}</div>
                <button onClick={register} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 18px', fontWeight: 800 }}>Crear perfil universitario</button>
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
                <label style={{ display: 'grid', gap: 8 }}><span>Origen</span><input value={route.origin} onChange={(e) => setRoute({ ...route, origin: e.target.value })} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Destino</span><input value={route.destination} onChange={(e) => setRoute({ ...route, destination: e.target.value })} style={field} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <label style={{ display: 'grid', gap: 8 }}><span>Modo</span><select value={route.mode} onChange={(e) => setRoute({ ...route, mode: e.target.value })} style={field}><option>MIO + caminata</option><option>Carro</option><option>Moto</option><option>Bicicleta</option><option>Taxi</option></select></label>
                  <label style={{ display: 'grid', gap: 8 }}><span>Hora</span><input value={route.time} onChange={(e) => setRoute({ ...route, time: e.target.value })} style={field} /></label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ color: '#93c5fd', fontWeight: 700 }}>Ruta sugerida con OpenStreetMap + GTFS</div>
                  <button onClick={() => setToast('Ruta recalculada con datos abiertos y opciones multimodales.')} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 18px', fontWeight: 800 }}>Calcular ruta</button>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>RESUMEN</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                <Metric label='Tiempo estimado' value={summary.duration} color='#7dd3fc' />
                <Metric label='Distancia' value={summary.distance} color='#86efac' />
                <Metric label='Seguridad' value={summary.safety} color='#fbbf24' />
                <Metric label='Parada segura' value='Estación Universidades' color='#c4b5fd' />
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{routeFns.map(f => <span key={f} style={{ color: '#dbeafe', fontSize: 10, background: 'rgba(59,130,246,.12)', borderRadius: 999, padding: '6px 8px' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'search' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 3</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Búsqueda, filtros y ordenamiento</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}><span>Zona</span><input value={searchState.zone} onChange={(e) => setSearchState({ ...searchState, zone: e.target.value })} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Hora</span><input value={searchState.time} onChange={(e) => setSearchState({ ...searchState, time: e.target.value })} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Facultad</span><input value={searchState.faculty} onChange={(e) => setSearchState({ ...searchState, faculty: e.target.value })} style={field} /></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Transporte</span><select value={searchState.transport} onChange={(e) => setSearchState({ ...searchState, transport: e.target.value })} style={field}><option>MIO</option><option>Carro</option><option>Moto</option><option>Caminata</option><option>Cualquiera</option></select></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Confianza mínima</span><select value={searchState.confidence} onChange={(e) => setSearchState({ ...searchState, confidence: e.target.value })} style={field}><option>4.8+</option><option>4.5+</option><option>4.0+</option><option>Cualquiera</option></select></label>
                <label style={{ display: 'grid', gap: 8 }}><span>Orden</span><select value={searchState.sort} onChange={(e) => setSearchState({ ...searchState, sort: e.target.value })} style={field}><option>Compatibilidad</option><option>Distancia</option><option>Tiempo</option></select></label>
              </div>
              <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
                {filteredResults.map((item) => (
                  <div key={item.name} style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(96,165,250,.28)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{item.name}</div>
                      <div style={{ color: '#93c5fd', fontWeight: 800 }}>{item.score}% compatibilidad</div>
                    </div>
                    <div style={{ marginTop: 6, color: '#dbeafe' }}>{item.zone} • {item.time} • {item.faculty} • {item.transport} • {item.safety}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>FILTROS</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{searchFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(125,211,252,.12)', color: '#dbeafe' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'match' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#a7f3d0', fontWeight: 800 }}>MÓDULO 4</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Emparejamiento de viajes</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                {matches.map((m) => <div key={m.traveler} style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(52,211,153,.3)', borderRadius: 14, padding: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}><div><div style={{ fontSize: 22, fontWeight: 800 }}>{m.traveler}</div><div style={{ color: '#cbd5e1' }}>{m.zone} • {m.time}</div></div><div style={{ background: 'rgba(16,185,129,.14)', borderRadius: 999, padding: '8px 12px', fontWeight: 800, color: '#a7f3d0' }}>{m.score}%</div></div><div style={{ marginTop: 8, color: '#dbeafe' }}>Modo: {m.mode}</div></div>)}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>RECOMENDACIÓN</div>
              <div style={{ marginTop: 18, background: 'linear-gradient(135deg, rgba(16,185,129,.12), rgba(59,130,246,.12))', borderRadius: 16, padding: 18, border: '1px solid rgba(52,211,153,.2)' }}>
                <div style={{ fontSize: 26, fontWeight: 800 }}>Ana Vélez</div>
                <div style={{ marginTop: 8, color: '#dbeafe' }}>Coincidencia 96% por zona, horario y nivel de confianza. Ruta recomendada segura desde El Caney hacia la universidad.</div>
              </div>
              <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{matchFns.map(f => <span key={f} style={{ padding: '6px 8px', fontSize: 10, borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#d1fae5' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'trips' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fbbf24', fontWeight: 800 }}>MÓDULO 4</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Gestión de viajes</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                {trips.map((t) => <div key={t.driver} style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 14, padding: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}><div><div style={{ fontSize: 20, fontWeight: 800 }}>{t.driver}</div><div style={{ color: '#dbeafe' }}>{t.route}</div></div><div style={{ color: '#fbbf24', fontWeight: 800 }}>{t.status}</div></div><div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', color: '#dbeafe' }}><span>Asientos: {t.seats}</span><span>Costo: {t.cost}</span></div></div>)}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>ACCIONES</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <button onClick={() => action('Oferta de viaje')} style={{ border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>Crear oferta</button>
                <button onClick={() => action('Solicitud de cupo')} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, background: 'rgba(148,163,184,.12)', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>Solicitar cupo</button>
                <button onClick={() => action('Costo y división')} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, background: '#0f172a', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>Calcular costo</button>
              </div>
              <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tripFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(245,158,11,.12)', color: '#fef3c7' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'safety' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fca5a5', fontWeight: 800 }}>MÓDULO 5</div>
              <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Seguridad y ubicación real</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                {alerts.map((a) => (
                  <div key={a.type} style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 800 }}>{a.type}</div>
                      <div style={{ color: '#fca5a5', fontWeight: 700 }}>{a.state}</div>
                    </div>
                    <div style={{ marginTop: 6, color: '#fecaca' }}>{a.detail}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                {Object.entries({ panic: 'Botón de pánico', geofence: 'Geocerca activa', emergency: 'Modo emergencia', arrival: 'Check-in de llegada' }).map(([key, label]) => (
                  <button key={key} onClick={() => toggleSafetyFeature(key)} style={{ border: safetyState[key] ? '1px solid rgba(239,68,68,.5)' : '1px solid rgba(148,163,184,.2)', borderRadius: 12, background: safetyState[key] ? 'rgba(239,68,68,.12)' : 'rgba(15,23,42,.8)', color: '#fff', padding: '12px 16px', fontWeight: 800, textAlign: 'left' }}>
                    {label} • {safetyState[key] ? 'ON' : 'OFF'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>EMERGENCIA</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <button onClick={() => action('Botón de pánico')} style={{ border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>Activar botón de pánico</button>
                <button onClick={() => action('Check-in de llegada')} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, background: 'rgba(148,163,184,.12)', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>Confirmar llegada segura</button>
                <button onClick={() => action('Alerta geográfica')} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, background: '#0f172a', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>Monitorear geocerca</button>
              </div>
              <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{safetyFns.map(f => <span key={f} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(239,68,68,.12)', color: '#fecaca' }}>{f}</span>)}</div>
            </div>
          </section>
        )}

        {active === 'admin' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#c4b5fd', fontWeight: 800 }}>MÓDULO 6</div>
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
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#c4b5fd', fontWeight: 800 }}>MÓDULO 7</div>
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
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#5eead4', fontWeight: 800 }}>MÓDULO 8</div>
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
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#f472b6', fontWeight: 800 }}>MÓDULO 9</div>
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
            </div>
          </section>
        )}

        {active === 'privacy' && (
          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 10</div>
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
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#f59e0b', fontWeight: 800 }}>MÓDULO 11</div>
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
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#a3e635', fontWeight: 800 }}>MÓDULO 12</div>
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
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fb7185', fontWeight: 800 }}>MÓDULO 13</div>
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
      </main>
    </div>
  );
}

function Panel({ title, value, color }) {
  return <div style={{ background: 'rgba(15,23,42,.8)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}><div style={{ color, fontWeight: 800, marginBottom: 4 }}>{title}</div><div style={{ color: '#dbeafe' }}>{value}</div></div>;
}

function Metric({ label, value, color }) {
  return <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.15)', borderRadius: 14, padding: 16 }}><div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div><div style={{ marginTop: 8, color, fontWeight: 800, fontSize: 24 }}>{value}</div></div>;
}
