import { useMemo } from 'react';
import { buildDashboardSummary } from '../services/dashboardSummary';
import Metric from './Metric';

export default function DashboardSection({
  authUser,
  dashboardError,
  dashboardLoading,
  dashboardTrips,
  dashboardReputation,
  dashboardConversations,
  selectedChatTripId,
  chatError,
  chatLoading,
  chatMessages,
  chatReadOnly,
  chatAction,
  chatDraft,
  dashboardChecklist,
  field,
  tripStatusLabels,
  onNavigate,
  onSelectChatTrip,
  onChatDraftChange,
  onSubmitMessage,
}) {
  const { metrics, activity, history } = useMemo(
    () => buildDashboardSummary(dashboardTrips, dashboardReputation, tripStatusLabels),
    [dashboardTrips, dashboardReputation, tripStatusLabels],
  );
  const selectedConversation = dashboardConversations.find(
    (trip) => String(trip.id) === selectedChatTripId,
  );

  return (
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 20 }}>
              {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16, marginTop: 20 }}>
              <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Actividad de viajes</h3>
                {activity.length
                  ? <div style={{ display: 'grid', gap: 10 }}>{activity.slice(0, 10).map((item) => <div key={item.key} style={{ borderBottom: '1px solid rgba(148,163,184,.15)', paddingBottom: 8 }}><strong>{item.label}</strong><div style={{ color: '#94a3b8', fontSize: 13 }}>{item.detail}</div></div>)}</div>
                  : <p style={{ color: '#94a3b8' }}>No tienes solicitudes recientes pendientes de respuesta.</p>}
                <button type="button" onClick={() => onNavigate('trips')} style={{ ...field, marginTop: 12 }}>Gestionar viajes</button>
              </div>
              <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Historial</h3>
                {history.length
                  ? <div style={{ display: 'grid', gap: 10, maxHeight: 330, overflowY: 'auto' }}>{history.map((item) => <div key={item.key} style={{ borderBottom: '1px solid rgba(148,163,184,.15)', paddingBottom: 8 }}><strong>{item.route}</strong><div style={{ color: '#cbd5e1', fontSize: 13 }}>{item.detail} · {tripStatusLabels[item.status] || item.status}</div></div>)}</div>
                  : <p style={{ color: '#94a3b8' }}>Aún no hay viajes registrados en tu historial.</p>}
                <button type="button" onClick={() => onNavigate('trust')} style={{ ...field, marginTop: 12 }}>Ver reputación y valoraciones</button>
              </div>
            </div>
          </>
        )}
      </div>

      {authUser?.role === 'student' && (
        <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#f9a8d4', fontWeight: 800 }}>COMUNICACIÓN PRIVADA POR VIAJE</div>
          <h3 style={{ margin: '8px 0 16px' }}>Chat con participantes aceptados</h3>
          {dashboardConversations.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
              <div style={{ display: 'grid', alignContent: 'start', gap: 8 }}>
                {dashboardConversations.map((conversation) => (
                  <button
                    type="button"
                    key={conversation.id}
                    aria-pressed={selectedChatTripId === String(conversation.id)}
                    onClick={() => onSelectChatTrip(String(conversation.id))}
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
                {selectedConversation && (
                  <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
                    Participantes: {selectedConversation.participants.map((participant) => participant.name).join(', ')}
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
                    <form onSubmit={onSubmitMessage} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      <input
                        aria-label="Escribe un mensaje para el viaje"
                        value={chatDraft}
                        maxLength={2000}
                        onChange={(event) => onChatDraftChange(event.target.value)}
                        placeholder="Escribe al grupo del viaje…"
                        required
                        style={{ ...field, flex: '1 1 180px', minWidth: 0 }}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 10 }}>
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
  );
}
