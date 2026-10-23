import { alertFunctions } from '../../data/appSectionData';

export default function AlertsSection({ notifications, onToggleNotification }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#f59e0b', fontWeight: 800 }}>MÓDULO 12</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Notificaciones y recordatorios</h2>
        <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
          Estas opciones solo guardan preferencias en este navegador. No programan recordatorios ni envían avisos; el envío externo requiere una integración y servicios configurados.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {notifications.map((item) => (
            <div key={item.id} style={{ background: item.active ? 'rgba(245,158,11,.08)' : 'rgba(148,163,184,.08)', border: `1px solid ${item.active ? 'rgba(245,158,11,.25)' : 'rgba(148,163,184,.25)'}`, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800 }}>{item.title}</div>
                <div style={{ color: '#dbeafe', fontSize: 12, marginTop: 4 }}>{item.channel}</div>
              </div>
              <button type="button" aria-pressed={item.active} onClick={() => onToggleNotification(item.id)} style={{ background: item.active ? 'rgba(245,158,11,.18)' : 'rgba(15,23,42,.9)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 10, color: '#fff', padding: '8px 12px', fontWeight: 700 }}>{item.active ? 'Desactivar preferencia' : 'Activar preferencia'}</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>ALERTAS</div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {alertFunctions.map((item) => <span key={item} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(245,158,11,.12)', color: '#fef3c7' }}>{item}</span>)}
        </div>
      </div>
    </section>
  );
}
