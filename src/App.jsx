import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  Users, 
  Calculator, 
  User, 
  Bell, 
  AlertTriangle, 
  Moon, 
  Sun, 
  Plus, 
  MessageSquare, 
  Car, 
  Bike, 
  Bus, 
  Footprints,
  GraduationCap,
  Sparkles,
  Info,
  FileText,
  Filter,
  Leaf,
  Home,
  CheckCircle2
} from 'lucide-react';

import { 
  UNIVERSITIES, 
  INITIAL_TRIPS, 
  CURRENT_STUDENT_USER, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_CHAT_MESSAGES,
  COMMUNITY_INCIDENTS
} from './data/mockData';

import InteractiveMap from './components/InteractiveMap';
import TripExplorer from './components/TripExplorer';
import CreateTripModal from './components/CreateTripModal';
import RouteCalculator from './components/RouteCalculator';
import StudentProfile from './components/StudentProfile';
import SafetyCenter from './components/SafetyCenter';
import ActiveTripChat from './components/ActiveTripChat';
import NotificationsDrawer from './components/NotificationsDrawer';

// New Advanced Modals & Validation Viewer
import JoinTripModal from './components/JoinTripModal';
import ArrivalCheckinModal from './components/ArrivalCheckinModal';
import IncidentReportModal from './components/IncidentReportModal';
import AdvancedFiltersModal from './components/AdvancedFiltersModal';
import InstitutionalVerificationModal from './components/InstitutionalVerificationModal';
import EcoSavingsModal from './components/EcoSavingsModal';
import InterviewRecorderModal from './components/InterviewRecorderModal';
import AcademicReportViewer from './components/AcademicReportViewer';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState('dark');

  // Navigation tab: 'map-explorer', 'calculator', 'report', 'safety', 'profile'
  const [activeTab, setActiveTab] = useState('map-explorer');

  // University network context
  const [activeUniversity, setActiveUniversity] = useState(UNIVERSITIES[0]); // Default UNIAJC Sur

  // Trips state
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState(INITIAL_TRIPS[0]);

  // Real-time Community Incidents
  const [incidents, setIncidents] = useState(COMMUNITY_INCIDENTS);

  // Modals and Drawers States
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [tripToJoin, setTripToJoin] = useState(null);
  const [isArrivalCheckinOpen, setIsArrivalCheckinOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isEcoSavingsOpen, setIsEcoSavingsOpen] = useState(false);
  const [isInterviewRecorderOpen, setIsInterviewRecorderOpen] = useState(false);

  // Advanced Filters State
  const [advancedFilters, setAdvancedFilters] = useState({
    modes: [],
    shift: 'all',
    onlyGirls: false,
    maxPrice: 6000
  });

  // Student Profile state
  const [studentUser, setStudentUser] = useState(CURRENT_STUDENT_USER);

  // Messages and Notifications
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT_MESSAGES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Toast alert
  const [toastMessage, setToastMessage] = useState(null);

  // SOS Banner
  const [activeSOSAlert, setActiveSOSAlert] = useState(null);

  // Toggle Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Handlers
  const handleCreateTrip = (newTrip) => {
    setTrips(prev => [newTrip, ...prev]);
    setSelectedTrip(newTrip);
    showToast(`¡Viaje publicado! Se añadió al mapa y a la red de coincidencias.`);
    
    // Add notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Nuevo Viaje Registrado',
      message: `Has publicado un viaje hacia ${newTrip.destination.name} (${newTrip.departureTime}).`,
      time: 'Justo ahora',
      read: false,
      type: 'info',
      icon: 'check-circle'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleOpenJoinModal = (trip) => {
    setTripToJoin(trip);
    setIsJoinModalOpen(true);
  };

  const handleConfirmJoin = (joinData) => {
    const { trip, securityPin, includeInsurance, totalToPay } = joinData;
    showToast(`¡Cupo confirmado con ${trip.driver.name}! Tu PIN de abordaje es ${securityPin}`);

    // Update available seats
    setTrips(prev => prev.map(t => {
      if (t.id === trip.id) {
        return {
          ...t,
          availableSeats: Math.max(0, t.availableSeats - 1),
          passengers: [...t.passengers, { name: studentUser.name.split(' ')[0], university: studentUser.universityName, avatar: studentUser.avatar }]
        };
      }
      return t;
    }));

    // Add confirmation message in chat
    const confirmMsg = {
      id: `msg-${Date.now()}`,
      sender: 'Sistema ViajaU',
      senderRole: 'Seguridad',
      isSystem: true,
      text: `✅ ${studentUser.name} se unió al viaje. PIN de seguridad: ${securityPin}. Seguro AXA: ${includeInsurance ? 'Activo' : 'No'}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, confirmMsg]);

    // Add notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Reserva Confirmada',
      message: `Viaje con ${trip.driver.name} hacia ${trip.destination.name}. PIN: ${securityPin}.`,
      time: 'Justo ahora',
      read: false,
      type: 'success',
      icon: 'check-circle'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleAddIncident = (newInc) => {
    setIncidents(prev => [newInc, ...prev]);
    showToast(`⚠️ Alerta comunitaria agregada al mapa de Cali.`);
    
    // Add notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Alerta Comunitaria en Ruta',
      message: `${newInc.title} en ${newInc.coords.join(', ')}.`,
      time: 'Justo ahora',
      read: false,
      type: 'warning',
      icon: 'alert-triangle'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleSendMessage = (newMsg) => {
    setChatMessages(prev => [...prev, newMsg]);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleTriggerSOS = (sosData) => {
    setActiveSOSAlert(sosData);
    showToast(`🚨 ¡ALERTA SOS ENVIADA! Transmitiendo a Central UNIAJC y Policía.`);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="top-header">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo-icon">
            <GraduationCap size={22} />
          </div>
          <div className="brand-title-wrap">
            <span className="brand-name">
              ViajaU <span style={{ fontSize: '0.8rem', background: 'var(--emerald-primary)', color: 'white', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Cali</span>
            </span>
            <span className="brand-tagline">Movilidad Segura por Zonas y Jornadas</span>
          </div>
        </div>

        {/* Center: University Network Switcher */}
        <div className="uni-selector-wrap" title="Cambiar campus universitario">
          <GraduationCap size={16} style={{ color: activeUniversity.color }} />
          <select 
            className="uni-select" 
            value={activeUniversity.id}
            onChange={(e) => {
              const found = UNIVERSITIES.find(u => u.id === e.target.value);
              if (found) {
                setActiveUniversity(found);
                showToast(`Campus cambiado a ${found.shortName}`);
              }
            }}
          >
            {UNIVERSITIES.map(u => (
              <option key={u.id} value={u.id}>{u.shortName}</option>
            ))}
          </select>
        </div>

        {/* Right Actions */}
        <div className="header-actions">
          {/* Academic Report Quick Shortcut */}
          <button 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--emerald-primary)', color: 'var(--emerald-primary)', fontWeight: 700 }}
            onClick={() => setActiveTab('report')}
            title="Ver Informe Académico de Validación UNIAJC"
          >
            <FileText size={15} />
            <span>Informe Académico</span>
          </button>

          {/* Quick SOS Panic Button */}
          <button 
            className="sos-header-btn"
            onClick={() => setActiveTab('safety')}
            title="Activar Botón SOS de Pánico"
          >
            <AlertTriangle size={15} />
            <span>SOS PÁNICO</span>
          </button>

          {/* Theme Switcher */}
          <button 
            className="btn-secondary" 
            style={{ padding: '8px' }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun size={17} style={{ color: '#fbbf24' }} /> : <Moon size={17} />}
          </button>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-secondary" 
              style={{ padding: '8px' }}
              onClick={() => setIsNotificationsOpen(true)}
              title="Notificaciones"
            >
              <Bell size={17} />
              {unreadNotifsCount > 0 && (
                <span style={{ position: 'absolute', top: -3, right: -3, background: 'var(--rose-primary)', color: 'white', width: '18px', height: '18px', borderRadius: '50%', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>

          {/* Student Profile Quick View */}
          <div 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-tertiary)', padding: '4px 10px 4px 4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
            title="Ver mi perfil de estudiante"
          >
            <img 
              src={studentUser.avatar} 
              alt={studentUser.name} 
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {studentUser.name.split(' ')[0]}
            </span>
          </div>
        </div>
      </header>

      {/* SOS Active Alert Banner */}
      {activeSOSAlert && (
        <div style={{ background: '#dc2626', color: 'white', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} />
            <span>ALERTA SOS ACTIVA ({activeSOSAlert.timestamp}): Transmitiendo ubicación de {activeSOSAlert.user} a Central UNIAJC y Policía.</span>
          </div>
          <button 
            style={{ background: 'white', color: '#dc2626', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '0.75rem' }}
            onClick={() => setActiveSOSAlert(null)}
          >
            Desactivar Alerta
          </button>
        </div>
      )}

      {/* Nav Tabs Bar */}
      <nav className="nav-tabs-bar">
        <button 
          className={`nav-tab-btn ${activeTab === 'map-explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('map-explorer')}
        >
          <Navigation size={17} />
          <span>Mapa & Viajes en Vivo</span>
        </button>

        <button 
          className={`nav-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator size={17} />
          <span>Calculador Multimodal (7 Modos)</span>
        </button>

        <button 
          className={`nav-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          <FileText size={17} />
          <span>Informe & Validación Académica</span>
        </button>

        <button 
          className={`nav-tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
          onClick={() => setActiveTab('safety')}
        >
          <ShieldCheck size={17} />
          <span>Seguridad & Seguro AXA</span>
        </button>

        <button 
          className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={17} />
          <span>Mi Carnet & Barrio</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {/* TAB 1: MAP & TRIP EXPLORER */}
        {activeTab === 'map-explorer' && (
          <div className="dashboard-grid">
            {/* Left: Interactive OpenStreetMap with MIO & Live GPS Simulation */}
            <InteractiveMap 
              selectedTrip={selectedTrip}
              activeTrips={trips}
              onSelectTrip={(trip) => setSelectedTrip(trip)}
              activeUniversity={activeUniversity}
              studentUser={studentUser}
              incidents={incidents}
              onOpenReportIncident={() => setIsIncidentModalOpen(true)}
              onOpenArrivalCheckin={() => setIsArrivalCheckinOpen(true)}
              onOpenEcoSavings={() => setIsEcoSavingsOpen(true)}
            />

            {/* Right: Trip Search & Matchmaking */}
            <TripExplorer 
              trips={trips}
              selectedTrip={selectedTrip}
              onSelectTrip={(trip) => setSelectedTrip(trip)}
              onOpenCreateTrip={() => setIsCreateTripOpen(true)}
              activeUniversity={activeUniversity}
              onRequestSeat={() => {}}
              onOpenJoinModal={handleOpenJoinModal}
              onOpenAdvancedFilters={() => setIsAdvancedFiltersOpen(true)}
              studentUser={studentUser}
            />
          </div>
        )}

        {/* TAB 2: MULTIMODAL ROUTE CALCULATOR */}
        {activeTab === 'calculator' && (
          <RouteCalculator 
            activeUniversity={activeUniversity}
            onSelectCalculatedTrip={(calculatedMode) => {
              setActiveTab('map-explorer');
              showToast(`Filtrando viajes de ${calculatedMode.name} en el mapa.`);
            }}
          />
        )}

        {/* TAB 3: ACADEMIC VALIDATION REPORT VIEWER (FROM VIAJAU DOCUMENT) */}
        {activeTab === 'report' && (
          <AcademicReportViewer 
            onOpenInterviewRecorder={() => setIsInterviewRecorderOpen(true)}
          />
        )}

        {/* TAB 4: SAFETY & AXA EMBEDDED INSURANCE */}
        {activeTab === 'safety' && (
          <SafetyCenter 
            studentUser={studentUser}
            onTriggerSOS={handleTriggerSOS}
            activeUniversity={activeUniversity}
            onOpenVerification={() => setIsVerificationOpen(true)}
            onOpenArrivalCheckin={() => setIsArrivalCheckinOpen(true)}
            onOpenReportIncident={() => setIsIncidentModalOpen(true)}
            onOpenEcoSavings={() => setIsEcoSavingsOpen(true)}
          />
        )}

        {/* TAB 5: STUDENT PROFILE & APPROXIMATE NEIGHBORHOOD */}
        {activeTab === 'profile' && (
          <StudentProfile 
            studentUser={studentUser}
            onUpdateProfile={(updated) => {
              setStudentUser(updated);
              showToast(`Perfil de ${updated.name} guardado con éxito.`);
            }}
            activeUniversity={activeUniversity}
            onOpenVerification={() => setIsVerificationOpen(true)}
          />
        )}
      </main>

      {/* Floating Chat Button for Active Trip */}
      {selectedTrip && (
        <button 
          className="btn-primary"
          style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200, padding: '12px 20px', borderRadius: 'var(--radius-full)', boxShadow: '0 8px 25px rgba(16,185,129,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <MessageSquare size={18} />
          <span>Chat de Viaje ({selectedTrip.destination.name.split(' ')[0]})</span>
        </button>
      )}

      {/* MODAL 1: Create Trip Modal */}
      <CreateTripModal 
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        onCreateTrip={handleCreateTrip}
        activeUniversity={activeUniversity}
        studentUser={studentUser}
      />

      {/* MODAL 2: Join Trip Modal with Security PIN & AXA Micro-Insurance */}
      <JoinTripModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        trip={tripToJoin}
        onConfirmJoin={handleConfirmJoin}
        studentUser={studentUser}
      />

      {/* MODAL 3: Arrival Check-in & Dead-man's Timer Modal */}
      <ArrivalCheckinModal 
        isOpen={isArrivalCheckinOpen}
        onClose={() => setIsArrivalCheckinOpen(false)}
        trip={selectedTrip}
        studentUser={studentUser}
        onConfirmArrival={() => showToast('¡Llegada segura a casa confirmada! Mensaje enviado.')}
        onTriggerSOS={handleTriggerSOS}
      />

      {/* MODAL 4: Community Transit Incident Report Modal */}
      <IncidentReportModal 
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onAddIncident={handleAddIncident}
        activeUniversity={activeUniversity}
        studentUser={studentUser}
      />

      {/* MODAL 5: Advanced Filters Modal */}
      <AdvancedFiltersModal 
        isOpen={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        onUpdateFilters={(f) => setAdvancedFilters(f)}
        onResetFilters={() => setAdvancedFilters({ modes: [], shift: 'all', onlyGirls: false, maxPrice: 6000 })}
      />

      {/* MODAL 6: Institutional Verification Modal */}
      <InstitutionalVerificationModal 
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        studentUser={studentUser}
        onVerificationComplete={(updated) => {
          setStudentUser(updated);
          showToast('¡Insignia de Estudiante Verificado desbloqueada!');
        }}
      />

      {/* MODAL 7: Financial & Carbon Savings Modal */}
      <EcoSavingsModal 
        isOpen={isEcoSavingsOpen}
        onClose={() => setIsEcoSavingsOpen(false)}
      />

      {/* MODAL 8: Field Interview & 5-Whys Logger Modal (Annex A) */}
      <InterviewRecorderModal 
        isOpen={isInterviewRecorderOpen}
        onClose={() => setIsInterviewRecorderOpen(false)}
      />

      {/* Active Trip Chat Drawer */}
      <ActiveTripChat 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        trip={selectedTrip}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        studentUser={studentUser}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Toast Alert Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', border: '1px solid var(--emerald-primary)', padding: '10px 22px', borderRadius: 'var(--radius-full)', zIndex: 3000, boxShadow: '0 8px 25px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, animation: 'fadeIn 0.2s ease-out' }}>
          <Sparkles size={16} style={{ color: 'var(--emerald-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer / Academic Validation Project Credits */}
      <footer className="app-footer">
        <div>
          <strong>ViajaU</strong> — Modelo de Movilidad Segura por Zonas y Jornadas para Estudiantes Universitarios en Cali.
        </div>
        <div>
          Autores: <strong>Kevin González</strong> • <strong>Claudia Aranda</strong> • <strong>Ana Vélez</strong> | UNIAJC 2026
        </div>
      </footer>
    </div>
  );
}
