import { modules, universities, field } from '../../config/appConfig';
import AppSectionContent from '../app-sections/AppSectionContent';
import ConfirmationModal from '../ConfirmationModal';
import { clearAuthToken, logoutAccount } from '../../services/authApi';

export default function AuthenticatedShell({ state, actions, viewModel }) {
  return <div style={{ minHeight: '100vh', background: '#020b10', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      {state.isBooting && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(16,185,129,.12), rgba(2,11,16,.95) 52%)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 92, height: 92, borderRadius: '50%', margin: '0 auto 20px', border: '2px solid rgba(52,211,153,.5)', boxShadow: '0 0 50px rgba(52,211,153,.15)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 900 }}>V</div>
            <div style={{ fontSize: 11, letterSpacing: '0.24em', color: '#86efac', fontWeight: 800, marginBottom: 8 }}>VIAJAU</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Preparando movilidad segura</div>
          </div>
        </div>
      )}

      {!state.isBooting && !state.isLoggedIn && (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div className="auth-shell" style={{ width: '100%', maxWidth: 980, borderRadius: 28, background: 'linear-gradient(135deg, rgba(15,23,42,.96), rgba(2,11,16,.96))', border: '1px solid rgba(148,163,184,.2)', boxShadow: '0 28px 80px rgba(15,23,42,.5)', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', overflow: 'hidden' }}>
            <div style={{ padding: 40, background: 'linear-gradient(135deg, rgba(16,185,129,.12), rgba(59,130,246,.08), transparent)' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#86efac', fontWeight: 800, marginBottom: 12 }}>VIAJAU</div>
              <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.08 }}>Movilidad compartida universitaria</h1>
              <p style={{ margin: '18px 0 28px', color: '#dbeafe', fontSize: 16, lineHeight: 1.7 }}>
                Validación por correo institucional, rutas consultadas mediante proveedores externos y registro de alertas SOS. No hay monitoreo 24/7 ni contacto automático con servicios de emergencia.
              </p>
              <div className="auth-benefits" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                <div style={{ background: 'rgba(15,23,42,.65)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 18, fontWeight: 800, color: '#86efac' }}>Correo institucional</div><div style={{ marginTop: 6, color: '#dbeafe', fontSize: 12 }}>Verifica el dominio universitario, no la identidad personal.</div></div>
                <div style={{ background: 'rgba(15,23,42,.65)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 18, fontWeight: 800, color: '#7dd3fc' }}>Rutas externas</div><div style={{ marginTop: 6, color: '#dbeafe', fontSize: 12 }}>La disponibilidad depende de proveedores externos.</div></div>
                <div style={{ background: 'rgba(15,23,42,.65)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 16 }}><div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>Alertas SOS</div><div style={{ marginTop: 6, color: '#dbeafe', fontSize: 12 }}>Se registran en la app; no sustituyen servicios de emergencia.</div></div>
              </div>
            </div>

            <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,.9)' }}>
              <div style={{ width: '100%', maxWidth: 360 }}>
                <div style={{ display: 'flex', gap: 8, background: 'rgba(15,23,42,.8)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 6, marginBottom: 20 }}>
                  <button onClick={() => state.setAuthMode('login')} style={{ flex: 1, border: 'none', background: state.authMode === 'login' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 800 }}>Ingresar</button>
                  <button onClick={() => state.setAuthMode('register')} style={{ flex: 1, border: 'none', background: state.authMode === 'register' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 800 }}>Registrarse</button>
                </div>

                <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 20, padding: 22 }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16 }}>
                    {state.authMode === 'login' ? 'Acceso a la cuenta' : state.authMode === 'forgot' ? 'Recuperar cuenta' : state.authMode === 'reset' ? 'Nueva contraseña' : 'Crear cuenta universitaria'}
                  </div>
                  {state.toast && <div role="alert" style={{ color: '#fecaca', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>{state.toast}</div>}

                  {state.authMode === 'register' && (
                    <>
                      <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                        <span style={{ color: '#dbeafe', fontWeight: 700 }}>Nombre completo</span>
                        <input value={state.loginForm.name} onChange={(e) => state.setLoginForm({ ...state.loginForm, name: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder="Tu nombre" />
                      </label>
                      <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                        <span style={{ color: '#dbeafe', fontWeight: 700 }}>Universidad</span>
                        <select value={state.uni.id} onChange={(e) => state.setUni(universities.find((item) => item.id === e.target.value) || universities[0])} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }}>
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
                          <input value={state.loginForm[key]} onChange={(e) => state.setLoginForm({ ...state.loginForm, [key]: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder={placeholder} />
                        </label>
                      ))}
                    </>
                  )}

                  <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                    <span style={{ color: '#dbeafe', fontWeight: 700 }}>Correo institucional</span>
                    <input value={state.loginForm.email} onChange={(e) => state.setLoginForm({ ...state.loginForm, email: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder="usuario@uniajc.edu.co" />
                  </label>

                  {state.authMode !== 'forgot' && (
                    <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                      <span style={{ color: '#dbeafe', fontWeight: 700 }}>{state.authMode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}</span>
                      <input type="password" value={state.loginForm.password} onChange={(e) => state.setLoginForm({ ...state.loginForm, password: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder="••••••••" />
                    </label>
                  )}

                  {state.authMode === 'login' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dbeafe', fontSize: 13 }}>
                        <input type="checkbox" checked={state.loginForm.remember} onChange={(e) => state.setLoginForm({ ...state.loginForm, remember: e.target.checked })} />
                        Recordarme
                      </label>
                      <button type="button" onClick={actions.handlePasswordRecovery} style={{ background: 'transparent', border: 'none', color: '#7dd3fc', fontWeight: 700 }}>Recuperar contraseña</button>
                    </div>
                  )}

                  {['register', 'reset'].includes(state.authMode) && (
                    <label style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                      <span style={{ color: '#dbeafe', fontWeight: 700 }}>Confirmar contraseña</span>
                      <input type="password" value={state.loginForm.password_confirmation} onChange={(e) => state.setLoginForm({ ...state.loginForm, password_confirmation: e.target.value })} style={{ ...field, borderColor: 'rgba(148,163,184,.3)' }} placeholder="Repite tu contraseña" />
                    </label>
                  )}

                  <button onClick={actions.handleAuthSubmit} style={{ width: '100%', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#052e16', padding: '12px 18px', fontWeight: 900, marginBottom: 10 }}>
                    {state.authMode === 'login' ? 'Entrar a ViajaU' : state.authMode === 'forgot' ? 'Enviar instrucciones' : state.authMode === 'reset' ? 'Actualizar contraseña' : 'Crear perfil universitario'}
                  </button>

                  <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.6 }}>
                    {state.authMode === 'login' ? '¿No tienes cuenta? Crea tu perfil con tu correo universitario.' : state.authMode === 'forgot' ? 'Si el correo está registrado, recibirás un enlace para recuperar la cuenta.' : state.authMode === 'reset' ? 'Usa una contraseña nueva de al menos 12 caracteres, con letras y números.' : 'Usa 12 caracteres o más. Para entrar, también deberás verificar tu correo institucional.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!state.isBooting && state.isLoggedIn && !state.isEmailVerified && (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 520, background: 'rgba(15,23,42,.9)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 24, padding: 32 }}>
            <h1 style={{ marginTop: 0 }}>Verifica tu correo institucional</h1>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>Enviamos un enlace a {state.email}. Verifica el buzón antes de acceder a las funciones de ViajaU.</p>
            {state.toast && <div role="status" style={{ color: '#a7f3d0', marginBottom: 16 }}>{state.toast}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={actions.sendVerificationEmail} style={{ ...field, cursor: 'pointer' }}>Reenviar verificación</button>
              <button onClick={actions.refreshEmailVerification} style={{ ...field, cursor: 'pointer' }}>Ya verifiqué mi correo</button>
              <button onClick={async () => {
                try {
                  await logoutAccount();
                  clearAuthToken();
                  state.setIsLoggedIn(false);
                  state.setAlertFeed([]);
                  state.setSafetyError('');
                  state.setActive('auth');
                } catch (error) {
                  state.setToast(error.message);
                }
              }} style={{ ...field, cursor: 'pointer' }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {!state.isBooting && state.isLoggedIn && state.isEmailVerified && (
        <>
      <header className="app-header" style={{ borderBottom: '1px solid rgba(148,163,184,.2)', padding: 18, position: 'sticky', top: 0, background: 'rgba(2,11,16,.75)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#86efac', fontWeight: 800 }}>VIAJAU</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Movilidad segura universitaria</div>
          </div>
          <nav className="view-navigation" aria-label="Vistas de ViajaU">
            {modules.filter((module) => {
              if (module.key === 'admin') return ['admin', 'university'].includes(state.authUser?.role);
              if (state.authUser?.role === 'security') return ['auth', 'safety'].includes(module.key);
              return true;
            }).map((m) => (
              <button key={m.key} onClick={() => state.setActive(m.key)} style={{ border: state.active === m.key ? '1px solid rgba(52,211,153,.5)' : '1px solid rgba(148,163,184,.2)', background: state.active === m.key ? 'rgba(16,185,129,.12)' : 'rgba(10,15,20,.75)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 700, transition: 'all 0.2s ease', transform: state.active === m.key ? 'translateY(-1px)' : 'none', boxShadow: state.active === m.key ? '0 8px 24px rgba(16,185,129,0.18)' : 'none' }}>
                {m.title}
              </button>
            ))}
            <button
              onClick={async () => {
                try {
                  await logoutAccount();
                  clearAuthToken();
                  state.setIsLoggedIn(false);
                  state.setAlertFeed([]);
                  state.setSafetyError('');
                  state.setActive('auth');
                } catch (error) {
                  state.setToast(error.message);
                }
              }}
              style={{ border: '1px solid rgba(248,113,113,.35)', background: 'rgba(127,29,29,.2)', color: '#fecaca', borderRadius: 10, padding: '10px 12px', fontWeight: 700 }}
            >
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 60px' }}>
        {state.toast && <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(52,211,153,.4)', borderRadius: 12, padding: '12px 14px', marginBottom: 18, color: '#d1fae5', animation: 'fadeIn 0.22s ease-out' }}>{state.toast}</div>}

        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(59,130,246,0.08), rgba(15,23,42,0.9))', border: '1px solid rgba(148,163,184,.18)', borderRadius: 24, padding: 24, marginBottom: 24, boxShadow: '0 22px 40px rgba(2,6,23,0.45)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 20, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{ background: 'rgba(52,211,153,0.14)', color: '#a7f3d0', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>MVP activo</span>
                <span style={{ background: 'rgba(96,165,250,0.12)', color: '#bfdbfe', border: '1px solid rgba(96,165,250,0.28)', borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Seguridad + matching</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 38, lineHeight: 1.1, maxWidth: 700 }}>ViajaU: movilidad compartida para estudiantes universitarios</h2>
              <p style={{ marginTop: 12, color: '#dbeafe', fontSize: 15, maxWidth: 660, lineHeight: 1.7 }}>
                Plataforma con validación por correo institucional, consulta de rutas mediante proveedores externos y registro de alertas SOS. No ofrece monitoreo 24/7 ni contacto automático con servicios de emergencia.
              </p>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.62)', border: '1px solid rgba(148,163,184,.22)', borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Estado del sistema</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#dbeafe' }}>Correo institucional</span>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>
                    {state.isEmailVerified && viewModel.validEmail ? 'Verificado' : 'Pendiente'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#dbeafe' }}>Ruta actual</span>
                  <span style={{ color: '#7dd3fc', fontWeight: 800 }}>{state.routeResult ? 'Calculada' : 'Sin calcular'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#dbeafe' }}>Seguridad de ruta</span>
                  <span style={{ color: '#fca5a5', fontWeight: 800 }}>No evaluada</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, marginBottom: 24 }}>
          {viewModel.summaryCards.map((card) => (
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

        <ConfirmationModal
          modal={state.modal}
          onClose={actions.closeModal}
          includeSafetyLocation={state.includeSafetyLocation}
          onToggleSafetyLocation={(includeLocation) => {
            state.setIncludeSafetyLocation(includeLocation);
            state.setSafetyLocationError('');
          }}
          safetyLocationError={state.safetyLocationError}
          safetyActionLoading={state.safetyActionLoading}
          onConfirmWithoutLocation={actions.confirmEmergency}
          field={field}
        />

          <AppSectionContent appState={state} actions={actions} viewModel={viewModel} />










      </main>
      </>
     )}
   </div>;
}
