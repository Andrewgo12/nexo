export default function SafetySection({
  authUser,
  safetyError,
  safetyAlertsLoading,
  alertFeed,
  safetyActionLoading,
  field,
  onResolveAlert,
  onRequestSOS,
}) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fca5a5', fontWeight: 800 }}>MÓDULO 6</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Seguridad y ubicación real</h2>
        <p style={{ color: '#cbd5e1' }}>Las alertas SOS quedan registradas para personal autorizado. Los participantes de viajes en curso pueden compartir GPS y registrar check-in. No se contacta automáticamente a autoridades ni contactos de confianza.</p>
        {safetyError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10, margin: '12px 0' }}>{safetyError}</div>}
        {safetyAlertsLoading && <div role="status" style={{ color: '#bae6fd' }}>Cargando alertas activas…</div>}
        {!safetyAlertsLoading && alertFeed.length === 0 && (
          <div role="status" style={{ color: '#cbd5e1' }}>
            {['admin', 'security'].includes(authUser?.role) ? 'No hay alertas SOS activas.' : 'Todavía no hay alertas SOS registradas durante esta sesión.'}
          </div>
        )}
        <div style={{ display: 'grid', gap: 14 }}>
          {alertFeed.map((alert) => (
            <div key={alert.id} style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 800 }}>{alert.type}</div>
                <div style={{ color: '#fca5a5', fontWeight: 700 }}>{alert.active ? 'Activa' : 'Atendida'}</div>
              </div>
              <div style={{ marginTop: 6, color: '#fecaca' }}>{alert.message}</div>
              {alert.student_profile?.name && <div style={{ marginTop: 6, color: '#cbd5e1' }}>Estudiante: {alert.student_profile.name} • {alert.student_profile.university}</div>}
              {alert.latitude !== null && alert.latitude !== undefined && alert.longitude !== null && alert.longitude !== undefined && (
                <a href={`https://www.openstreetmap.org/?mlat=${alert.latitude}&mlon=${alert.longitude}#map=17/${alert.latitude}/${alert.longitude}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, color: '#93c5fd' }}>
                  Ver ubicación GPS{alert.accuracy_meters ? ` (±${alert.accuracy_meters} m)` : ''}
                </a>
              )}
              {['admin', 'security'].includes(authUser?.role) && alert.active && (
                <button
                  type="button"
                  disabled={safetyActionLoading === `resolve-${alert.id}`}
                  onClick={() => onResolveAlert(alert.id)}
                  style={{ display: 'block', ...field, marginTop: 10, padding: '7px 10px', cursor: 'pointer' }}
                >
                  {safetyActionLoading === `resolve-${alert.id}` ? 'Actualizando…' : 'Marcar como atendida'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>EMERGENCIA</div>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <button type="button" onClick={onRequestSOS} disabled={safetyActionLoading === 'panic'} style={{ border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', padding: '12px 16px', fontWeight: 800 }}>Activar botón de pánico</button>
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
  );
}
