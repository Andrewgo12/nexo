import Metric from '../Metric';

export default function TrustSection({
  authUser,
  reputationLoading,
  reputationError,
  reputationData,
  reputationAction,
  reviewForm,
  reportForm,
  adminReports,
  adminReportsMeta,
  field,
  onReviewFormChange,
  onReportFormChange,
  onSubmitReview,
  onSubmitReport,
  onModerateReport,
  onAdminReportsPageChange,
}) {
  return (
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 18, marginTop: 24 }}>
              <form onSubmit={onSubmitReview} style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <h3 style={{ margin: 0 }}>Valorar participante de un viaje</h3>
                <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                  Viaje completado
                  <select required value={reviewForm.trip_id} onChange={(event) => onReviewFormChange('trip_id', event.target.value)} style={field}>
                    <option value="">Selecciona un viaje</option>
                    {reputationData.completed_trips.map((trip) => <option key={trip.trip_id} value={trip.trip_id}>{trip.route}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                  Participante
                  <select required value={reviewForm.reviewee_profile_id} onChange={(event) => onReviewFormChange('reviewee_profile_id', event.target.value)} style={field}>
                    <option value="">Selecciona a quién valorar</option>
                    {reputationData.completed_trips.find((trip) => String(trip.trip_id) === reviewForm.trip_id)?.participants
                      .filter((participant) => !participant.reviewed)
                      .map((participant) => <option key={participant.profile_id} value={participant.profile_id}>{participant.name} · {participant.university}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                  Calificación
                  <select value={reviewForm.rating} onChange={(event) => onReviewFormChange('rating', event.target.value)} style={field}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} de 5 estrellas</option>)}
                  </select>
                </label>
                <textarea maxLength={1000} placeholder="Comentario opcional (máximo 1000 caracteres)" value={reviewForm.comment} onChange={(event) => onReviewFormChange('comment', event.target.value)} style={{ ...field, minHeight: 80 }} />
                <button type="submit" disabled={reputationAction === 'review'} style={field}>{reputationAction === 'review' ? 'Enviando…' : 'Enviar valoración'}</button>
              </form>
              <form onSubmit={onSubmitReport} style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <h3 style={{ margin: 0 }}>Reportar conducta</h3>
                <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                  Viaje relacionado
                  <select required value={reportForm.trip_id} onChange={(event) => onReportFormChange('trip_id', event.target.value)} style={field}>
                    <option value="">Selecciona un viaje</option>
                    {reputationData.reportable_trips.map((trip) => <option key={trip.trip_id} value={trip.trip_id}>{trip.route} · {trip.status === 'en-curso' ? 'En curso' : 'Completado'}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                  Persona reportada
                  <select required value={reportForm.reported_profile_id} onChange={(event) => onReportFormChange('reported_profile_id', event.target.value)} style={field}>
                    <option value="">Selecciona a un participante</option>
                    {reputationData.reportable_trips.find((trip) => String(trip.trip_id) === reportForm.trip_id)?.participants
                      .map((participant) => <option key={participant.profile_id} value={participant.profile_id}>{participant.name}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                  Motivo
                  <select value={reportForm.category} onChange={(event) => onReportFormChange('category', event.target.value)} style={field}>
                    <option value="safety">Seguridad</option><option value="harassment">Acoso</option><option value="no_show">No se presentó</option><option value="conduct">Conducta</option><option value="other">Otro</option>
                  </select>
                </label>
                <textarea required minLength={10} maxLength={1500} placeholder="Describe lo ocurrido (10–1500 caracteres)" value={reportForm.description} onChange={(event) => onReportFormChange('description', event.target.value)} style={{ ...field, minHeight: 80 }} />
                <button type="submit" disabled={reputationAction === 'report'} style={field}>{reputationAction === 'report' ? 'Enviando…' : 'Enviar reporte privado'}</button>
              </form>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 18, marginTop: 24 }}>
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
                      <button key={status} type="button" disabled={reputationAction === `report-${report.id}`} onClick={() => onModerateReport(report.id, status)} style={field}>{label}</button>
                    ))}
                  </div>
                </article>
              ))
              : <p style={{ color: '#94a3b8' }}>No hay reportes abiertos.</p>}
            {adminReportsMeta.total > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14, color: '#94a3b8', fontSize: 12 }}>
                <span>{adminReportsMeta.total} reportes abiertos · página {adminReportsMeta.current_page} de {adminReportsMeta.last_page}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={adminReportsMeta.current_page <= 1} onClick={() => onAdminReportsPageChange(adminReportsMeta.current_page - 1)} style={field}>Anterior</button>
                  <button type="button" disabled={adminReportsMeta.current_page >= adminReportsMeta.last_page} onClick={() => onAdminReportsPageChange(adminReportsMeta.current_page + 1)} style={field}>Siguiente</button>
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
  );
}
