'use client'

import { useState } from 'react'
import {
  Bell,
  BusFront,
  CarFront,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  GraduationCap,
  Home,
  Info,
  LocateFixed,
  LockKeyhole,
  LogIn,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Plus,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react'

const routes = [
  { id: 1, name: 'Ruta Sur · MIO E21', time: '21:20', from: 'Universidad Autónoma', to: 'Ciudad Jardín', people: 4, color: 'coral' },
  { id: 2, name: 'Ruta Oeste · MIO A12', time: '21:45', from: 'Campus Antonio José', to: 'San Fernando', people: 7, color: 'blue' },
  { id: 3, name: 'Ruta Norte · MIO T31', time: '22:10', from: 'Sede Norte', to: 'La Flora', people: 3, color: 'green' },
]

export default function Page() {
  const [activeTab, setActiveTab] = useState('inicio')
  const [showLogin, setShowLogin] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showCampus, setShowCampus] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedRoute, setSelectedRoute] = useState(1)
  const [campus, setCampus] = useState('Universidad Autónoma')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [joined, setJoined] = useState(false)
  const [routeMode, setRouteMode] = useState('Todas')
  const [locationShared, setLocationShared] = useState(false)
  const [institutionalEmail, setInstitutionalEmail] = useState('')
  const [profileName, setProfileName] = useState('Andrea Martínez')

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 2800)
  }

  const handleJoin = () => {
    setJoined(true)
    setShowRoute(false)
    showToast('Te uniste a la ruta. Tu cupo está reservado.')
  }

  const handleLogin = () => {
    if (!email || !password) {
      showToast('Completa tu correo y contraseña para continuar')
      return
    }
    setShowLogin(false)
    showToast('Sesión iniciada correctamente')
  }

  const handleRegister = () => {
    if (!fullName || !institutionalEmail) {
      showToast('Completa tu nombre y correo institucional')
      return
    }
    setProfileName(fullName)
    setShowRegister(false)
    showToast('Cuenta creada. Revisa tu correo institucional.')
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><Navigation /></div>
          <div><strong>Viaja<span>U</span></strong><small>Movilidad segura</small></div>
        </div>
        <button className="campus-card" onClick={() => setShowCampus(true)}>
          <div className="campus-icon"><GraduationCap /></div>
          <div><span>Campus conectado</span><strong>{campus}</strong></div>
          <ChevronDown className="chevron" />
        </button>
        <nav className="main-nav" aria-label="Navegación principal">
          <button className={activeTab === 'inicio' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('inicio')}><Home /><span>Inicio</span></button>
          <button className={activeTab === 'mis-rutas' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('mis-rutas')}><Route /><span>Mis rutas</span><b>2</b></button>
          <button className={activeTab === 'comunidad' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('comunidad')}><Users /><span>Comunidad</span></button>
          <button className={activeTab === 'seguridad' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('seguridad')}><ShieldCheck /><span>Seguridad</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="help-card" onClick={() => setShowHelp(true)}><CircleHelp /><div><strong>¿Necesitas ayuda?</strong><span>Estamos para acompañarte</span></div><ChevronRight /></button>
          <button className="profile-mini" onClick={() => setShowProfile(true)}><div className="avatar">AM</div><div><strong>Andrea Martínez</strong><span>Estudiante verificada</span></div><ChevronDown /></button>
        </div>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menú" onClick={() => setShowMobileNav(true)}><Menu /></button>
          <div className="breadcrumb"><span>ViajaU</span><ChevronRight /><strong>{activeTab === 'inicio' ? 'Inicio' : activeTab.replace('-', ' ')}</strong></div>
          <div className="top-actions">
            <button className="icon-btn notification-btn" aria-label="Notificaciones" onClick={() => setShowNotifications(!showNotifications)}><Bell />{!joined && <i />}</button>
            <button className="user-trigger" onClick={() => setShowProfile(!showProfile)}><div className="avatar">AM</div><span>Andrea</span><ChevronDown /></button>
          </div>
          {showNotifications && <div className="popover notification-popover"><div className="popover-heading"><strong>Notificaciones</strong><span>2 nuevas</span></div><div className="notification"><div className="notif-dot green-dot"><Check /></div><div><strong>Ruta confirmada</strong><p>Tu cupo en Ruta Sur está reservado.</p><small>Hace 8 min</small></div></div><div className="notification"><div className="notif-dot blue-dot"><Users /></div><div><strong>Nuevo compañero</strong><p>Juan Pablo se unió a tu ruta.</p><small>Hace 32 min</small></div></div></div>}
          {showProfile && <div className="popover profile-popover"><button onClick={() => setActiveTab('perfil')}><UserRound /> Mi perfil</button><button onClick={() => setActiveTab('seguridad')}><ShieldCheck /> Centro de seguridad</button><button className="logout" onClick={() => setShowLogin(true)}><LogIn /> Cerrar sesión</button></div>}
        </header>

        {showMobileNav && <div className="mobile-nav-backdrop" onClick={() => setShowMobileNav(false)}><aside className="mobile-drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div className="brand-lockup"><div className="brand-mark"><Navigation /></div><div><strong>Viaja<span>U</span></strong><small>Movilidad segura</small></div></div><button className="drawer-close" aria-label="Cerrar menú" onClick={() => setShowMobileNav(false)}><X /></button></div><div className="drawer-campus"><GraduationCap /><div><span>Campus conectado</span><strong>Universidad Autónoma</strong></div></div><nav className="drawer-nav" aria-label="Menú móvil"><button className={activeTab === 'inicio' ? 'active' : ''} onClick={() => { setActiveTab('inicio'); setShowMobileNav(false) }}><Home /><span>Inicio</span></button><button className={activeTab === 'mis-rutas' ? 'active' : ''} onClick={() => { setActiveTab('mis-rutas'); setShowMobileNav(false) }}><Route /><span>Mis rutas</span><b>2</b></button><button className={activeTab === 'comunidad' ? 'active' : ''} onClick={() => { setActiveTab('comunidad'); setShowMobileNav(false) }}><Users /><span>Comunidad</span></button><button className={activeTab === 'seguridad' ? 'active' : ''} onClick={() => { setActiveTab('seguridad'); setShowMobileNav(false) }}><ShieldCheck /><span>Seguridad</span></button></nav><div className="drawer-help"><CircleHelp /><span>¿Necesitas ayuda?</span><ChevronRight /></div><button className="drawer-profile" onClick={() => { setShowProfile(true); setShowMobileNav(false) }}><div className="avatar">AM</div><div><strong>Andrea Martínez</strong><span>Estudiante verificada</span></div><ChevronRight /></button></aside></div>}

        <div className="page-content">
          {activeTab === 'inicio' && <>
            <section className="welcome-row"><div><p className="eyebrow">Jueves, 24 de abril de 2026</p><h1>Buenas noches, Andrea <span>✦</span></h1><p className="subtitle">Tu trayecto seguro empieza aquí.</p></div><button className="primary-btn" onClick={() => setShowRoute(true)}><Plus /> Crear una ruta</button></section>
            <div className="mobile-quick-actions"><button onClick={() => setShowRoute(true)}><Plus /> Crear ruta</button><button onClick={() => setShowNotifications(true)}><Bell /> Alertas{!joined && <i />}</button></div>
            <section className="stats-grid"><div className="stat-card"><div className="stat-icon teal"><ShieldCheck /></div><div><span>Viajes seguros</span><strong>12</strong><small><span className="up">↑ 3</span> este mes</small></div></div><div className="stat-card"><div className="stat-icon orange"><Clock3 /></div><div><span>Próximo viaje</span><strong>21:20</strong><small>En 42 minutos</small></div></div><div className="stat-card"><div className="stat-icon purple"><Users /></div><div><span>Comunidad</span><strong>248</strong><small>estudiantes activos</small></div></div></section>
            <section className="dashboard-grid">
              <div className="map-card"><div className="card-heading"><div><h2>Mapa de movilidad</h2><p>Rutas activas cerca de ti</p></div><button className="filter-btn" onClick={() => setShowFilters(true)}><SlidersHorizontal /> Filtrar</button></div><div className="map-view"><div className="map-label label-one"><MapPin /> Campus</div><div className="map-label label-two"><MapPin /> San Fernando</div><div className="map-label label-three"><MapPin /> Ciudad Jardín</div><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" /><div className="map-road road-four" /><div className="route-line route-a" /><div className="route-line route-b" /><div className="route-line route-c" /><div className="you-pin"><div className="pulse" /><LocateFixed /></div><div className="map-legend"><span><i className="legend-dot active-dot" /> Tu ubicación</span><span><i className="legend-line" /> Ruta activa</span></div><button className="locate-btn" aria-label="Abrir mapa completo" onClick={() => setShowMap(true)}><LocateFixed /></button></div></div>
              <div className="routes-card"><div className="card-heading"><div><h2>Rutas recomendadas</h2><p>Basadas en tu zona y jornada</p></div><button className="text-btn" onClick={() => setActiveTab('mis-rutas')}>Ver todas <ChevronRight /></button></div><div className="route-list">{routes.map((route) => <button className="route-item" key={route.id} onClick={() => { setSelectedRoute(route.id); setShowRoute(true) }}><div className={`route-badge ${route.color}`}><BusFront /></div><div className="route-info"><strong>{route.name}</strong><span><MapPin /> {route.from} <ChevronRight /> {route.to}</span><small><Users /> {route.people} estudiantes · <Clock3 /> Sale {route.time}</small></div><ChevronRight className="route-arrow" /></button>)}</div></div>
            </section>
            <section className="safety-banner"><div className="safety-icon"><LockKeyhole /></div><div><strong>Tu seguridad es nuestra prioridad</strong><p>Todos los usuarios están verificados con correo institucional. Comparte tu ubicación solo con tu grupo de ruta.</p></div><button onClick={() => setActiveTab('seguridad')}>Conoce más <ChevronRight /></button></section>
          </>}
          {activeTab === 'mis-rutas' && <section className="inner-page"><p className="eyebrow">Tu movilidad</p><h1>Mis rutas</h1><p className="subtitle">Consulta y administra tus próximos trayectos.</p><div className="route-full-list">{routes.slice(0, 2).map(route => <div className="route-full-card" key={route.id}><div className={`route-badge ${route.color}`}><BusFront /></div><div className="route-info"><strong>{route.name}</strong><span>{route.from} <ChevronRight /> {route.to}</span><small><Clock3 /> Hoy, {route.time} · <Users /> {route.people} pasajeros</small></div><Badge text={route.id === 1 ? 'Confirmada' : 'Próxima'} /><button className="icon-btn" aria-label={`Ver ${route.name}`} onClick={() => { setSelectedRoute(route.id); setShowRoute(true) }}><ChevronRight /></button></div>)}</div><div className="empty-route"><Route /><h3>¿Quieres crear otra ruta?</h3><p>Encuentra compañeros que compartan tu camino a casa.</p><button className="primary-btn" onClick={() => setShowRoute(true)}><Plus /> Crear una ruta</button></div></section>}
          {activeTab === 'comunidad' && <section className="inner-page"><p className="eyebrow">Red universitaria</p><h1>Comunidad ViajaU</h1><p className="subtitle">Personas verificadas que se mueven contigo.</p><div className="community-grid"><div className="community-card"><div className="avatar-stack"><div className="avatar teal-bg">JM</div><div className="avatar purple-bg">SL</div><div className="avatar orange-bg">CP</div><div className="avatar more">+245</div></div><h3>248 estudiantes activos</h3><p>Todos pertenecen a una institución universitaria verificada.</p><button className="secondary-btn" onClick={() => showToast('La comunidad estará disponible cuando confirmes tu correo institucional')}>Explorar comunidad <ChevronRight /></button></div><div className="community-card testimonial"><MessageCircle /><p>“Ahora puedo quedarme a estudiar hasta tarde sin preocuparme por volver sola.”</p><strong>Laura Gómez · Universidad Javeriana</strong></div></div></section>}
          {activeTab === 'seguridad' && <section className="inner-page"><p className="eyebrow">Viaja acompañada</p><h1>Centro de seguridad</h1><p className="subtitle">Herramientas para que cada trayecto sea más tranquilo.</p><div className="security-grid"><div className="security-feature"><ShieldCheck /><h3>Identidad verificada</h3><p>Validamos el correo institucional de cada miembro de la comunidad.</p><Badge text="Activo" /></div><div className="security-feature"><LocateFixed /><h3>Ubicación compartida</h3><p>Comparte tu trayecto en tiempo real con tus contactos de confianza.</p><button className="secondary-btn" onClick={() => setLocationShared(!locationShared)}>{locationShared ? 'Ubicación activa' : 'Configurar'} <ChevronRight /></button></div><div className="security-feature"><Bell /><h3>Alertas de trayecto</h3><p>Recibe notificaciones cuando tu grupo salga o llegue a destino.</p><button className="secondary-btn" onClick={() => setShowNotifications(true)}>Administrar <ChevronRight /></button></div></div></section>}
        </div>
      </section>

      {showFilters && <div className="modal-backdrop" onClick={() => setShowFilters(false)}><div className="modal filter-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowFilters(false)}><X /></button><div className="modal-icon"><SlidersHorizontal /></div><p className="eyebrow">Preferencias</p><h2>Filtrar rutas</h2><p className="modal-copy">Personaliza las opciones que aparecen cerca de ti.</p><label>Tipo de transporte</label><div className="filter-options">{['Todas', 'MIO', 'Compartido'].map(mode => <button key={mode} className={routeMode === mode ? 'filter-option selected' : 'filter-option'} onClick={() => setRouteMode(mode)}><BusFront /> {mode}{routeMode === mode && <Check />}</button>)}</div><button className="primary-btn full-btn" onClick={() => setShowFilters(false)}>Aplicar filtros <Check /></button></div></div>}
      {showMap && <div className="modal-backdrop map-full-backdrop" onClick={() => setShowMap(false)}><div className="modal map-full-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowMap(false)}><X /></button><p className="eyebrow">Navegación en tiempo real</p><h2>Mapa de movilidad</h2><p className="modal-copy">Rutas activas y puntos de encuentro cerca de tu ubicación.</p><div className="map-view expanded-map"><div className="map-label label-one"><MapPin /> Campus</div><div className="map-label label-two"><MapPin /> San Fernando</div><div className="map-label label-three"><MapPin /> Ciudad Jardín</div><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" /><div className="route-line route-a" /><div className="route-line route-b" /><div className="route-line route-c" /><div className="you-pin"><div className="pulse" /><LocateFixed /></div></div><button className="primary-btn full-btn" onClick={() => { setShowMap(false); setShowRoute(true) }}>Elegir una ruta <ChevronRight /></button></div></div>}
      {showRegister && <div className="modal-backdrop" onClick={() => setShowRegister(false)}><div className="modal login-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowRegister(false)}><X /></button><div className="login-brand"><div className="brand-mark"><Navigation /></div><strong>Viaja<span>U</span></strong></div><h2>Crea tu cuenta segura</h2><p className="modal-copy">Verifica tu identidad universitaria para viajar acompañada.</p><label>Nombre completo</label><div className="input-box"><UserRound /><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Andrea Martínez" /></div><label>Correo institucional</label><div className="input-box"><span>@</span><input value={institutionalEmail} onChange={e => setInstitutionalEmail(e.target.value)} placeholder="nombre@universidad.edu.co" /></div><button className="primary-btn full-btn" onClick={handleRegister}>Crear cuenta <Check /></button><div className="secure-note"><LockKeyhole /> Solo aceptamos correos institucionales</div></div></div>}
      {showRoute && <div className="modal-backdrop" onClick={() => setShowRoute(false)}><div className="modal route-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowRoute(false)}><X /></button><div className="modal-icon"><Route /></div><p className="eyebrow">Ruta segura</p><h2>Encuentra tu grupo</h2><p className="modal-copy">Seleccionamos opciones según tu zona, jornada y transporte.</p><label>¿Desde dónde sales?</label><div className="select-box"><MapPin /> Universidad Autónoma <ChevronDown /></div><label>Elige una ruta compatible</label><div className="modal-routes">{routes.map(r => <button key={r.id} className={selectedRoute === r.id ? 'modal-route selected' : 'modal-route'} onClick={() => setSelectedRoute(r.id)}><div className={`route-badge ${r.color}`}><BusFront /></div><div><strong>{r.name}</strong><span>{r.time} · {r.people} estudiantes</span></div>{selectedRoute === r.id && <div className="check-circle"><Check /></div>}</button>)}</div><button className="primary-btn full-btn" onClick={handleJoin}>{joined ? 'Ruta reservada' : 'Unirme a esta ruta'} <ChevronRight /></button><div className="secure-note"><LockKeyhole /> Tu información está protegida</div></div></div>}
      {showLogin && <div className="modal-backdrop" onClick={() => setShowLogin(false)}><div className="modal login-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowLogin(false)}><X /></button><div className="login-brand"><div className="brand-mark"><Navigation /></div><strong>Viaja<span>U</span></strong></div><h2>Vuelve a viajar seguro</h2><p className="modal-copy">Ingresa con tu correo institucional para continuar.</p><label>Correo institucional</label><div className="input-box"><span>@</span><input value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre@universidad.edu.co" /></div><label>Contraseña</label><div className="input-box"><LockKeyhole /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div><button className="primary-btn full-btn" onClick={handleLogin}>Iniciar sesión <LogIn /></button><p className="login-foot">¿Aún no tienes cuenta? <button onClick={() => { setShowLogin(false); setShowRegister(true) }}>Regístrate gratis</button></p></div></div>}
      {showCampus && <div className="modal-backdrop" onClick={() => setShowCampus(false)}><div className="modal campus-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowCampus(false)}><X /></button><div className="modal-icon"><GraduationCap /></div><p className="eyebrow">Tu institución</p><h2>Cambia de campus</h2><p className="modal-copy">Elige el campus para recibir rutas cercanas.</p><div className="filter-options">{['Universidad Autónoma', 'Campus Antonio José', 'Sede Norte'].map(option => <button key={option} className={campus === option ? 'filter-option selected' : 'filter-option'} onClick={() => setCampus(option)}><GraduationCap /> {option}{campus === option && <Check />}</button>)}</div><button className="primary-btn full-btn" onClick={() => { setShowCampus(false); setToastMessage('Campus actualizado'); setTimeout(() => setToastMessage(''), 2800) }}>Guardar campus <Check /></button></div></div>}
      {showHelp && <div className="modal-backdrop" onClick={() => setShowHelp(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowHelp(false)}><X /></button><div className="modal-icon"><CircleHelp /></div><p className="eyebrow">Acompañamiento</p><h2>¿Cómo podemos ayudarte?</h2><p className="modal-copy">Estamos disponibles para orientarte durante tu trayecto.</p><div className="filter-options"><button className="filter-option" onClick={() => { setShowHelp(false); setToastMessage('Solicitud enviada al equipo de soporte'); setTimeout(() => setToastMessage(''), 2800) }}><MessageCircle /> Contactar soporte <ChevronRight /></button><button className="filter-option" onClick={() => { setShowHelp(false); setActiveTab('seguridad') }}><ShieldCheck /> Revisar seguridad <ChevronRight /></button></div></div></div>}
      {toastMessage && <div className="app-toast" role="status"><Check /> {toastMessage}</div>}
    </main>
  )
}

function Badge({ text }: { text: string }) { return <span className="status-badge"><Check /> {text}</span> }
