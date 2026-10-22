export default function TripManagementSection(props) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fbbf24', fontWeight: 800 }}>MÓDULO 5</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Gestión de viajes</h2>
        <p style={{ color: '#cbd5e1' }}>Publica ofertas reales, solicita cupos y administra las respuestas desde tu cuenta verificada.</p>
        {props.tripLoading && <div role="status" style={{ color: '#bae6fd' }}>Cargando ofertas y solicitudes…</div>}
        {props.tripError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10, margin: '12px 0' }}>{props.tripError}</div>}

        <h3 style={{ marginTop: 20 }}>Ofertas disponibles</h3>
        {!props.tripLoading && !props.tripError && props.tripCards.length === 0 && <div role="status" style={{ color: '#cbd5e1' }}>No hay ofertas activas disponibles en este momento.</div>}
        <div style={{ display: 'grid', gap: 12 }}>
          {props.tripCards.map((offer) => (
            <div key={offer.id} style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div><div style={{ fontSize: 20, fontWeight: 800 }}>{offer.name}</div><div style={{ color: '#dbeafe' }}>{offer.origin} → {offer.destination} • {offer.departure_date} {offer.time}</div></div>
                <div style={{ color: '#fbbf24', fontWeight: 800 }}>{offer.university}</div>
              </div>
              <div style={{ marginTop: 8, color: '#dbeafe' }}>Modo: {offer.transport} • {offer.seats} cupo(s) • {offer.cost}</div>
              <button
                disabled={props.tripActionLoading === `request-${offer.id}` || offer.seats < 1 || props.myTripData.requests.some((item) => item.offer.id === offer.id)}
                onClick={() => props.runTripAction(`request-${offer.id}`, () => props.requestTravelSeat(offer.id), 'Solicitud enviada al responsable de la oferta.')}
                style={{ marginTop: 12, border: '1px solid rgba(251,191,36,.3)', background: 'rgba(245,158,11,.12)', color: '#fff', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}
              >
                {props.tripActionLoading === `request-${offer.id}` ? 'Enviando…' : props.myTripData.requests.some((item) => item.offer.id === offer.id) ? 'Solicitud registrada' : 'Solicitar cupo'}
              </button>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 24 }}>Mis ofertas y solicitudes entrantes</h3>
        {!props.tripLoading && !props.tripError && props.myTripData.offers.length === 0 && <div style={{ color: '#cbd5e1' }}>Aún no has publicado ofertas.</div>}
        <div style={{ display: 'grid', gap: 12 }}>
          {props.myTripData.offers.map((offer) => (
            <div key={offer.id} style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 800 }}>{offer.origin} → {offer.destination} • {offer.departure_date} {offer.departure_time}</div>
              <div style={{ marginTop: 4, color: '#cbd5e1' }}>{props.tripStatusLabels[offer.status] || offer.status} • {offer.seats} cupo(s) disponibles • {offer.cost}</div>
              {offer.requests.map((tripRequest) => (
                <div key={tripRequest.id} style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(148,163,184,.18)' }}>
                  <div>{tripRequest.requester.name} • {tripRequest.requester.university} • {props.tripStatusLabels[tripRequest.status] || tripRequest.status}</div>
                  {tripRequest.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button disabled={props.tripActionLoading === `accept-${tripRequest.id}`} onClick={() => props.runTripAction(`accept-${tripRequest.id}`, () => props.updateTravelRequest(tripRequest.id, 'accepted'), 'Solicitud aceptada y cupo reservado.')} style={{ ...props.field, padding: '7px 10px', cursor: 'pointer' }}>Aceptar</button>
                      <button disabled={props.tripActionLoading === `reject-${tripRequest.id}`} onClick={() => props.runTripAction(`reject-${tripRequest.id}`, () => props.updateTravelRequest(tripRequest.id, 'rejected'), 'Solicitud rechazada.')} style={{ ...props.field, padding: '7px 10px', cursor: 'pointer' }}>Rechazar</button>
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {offer.status === 'oferta-activa' && offer.requests.some((item) => item.status === 'accepted') && (
                  <button onClick={() => props.runTripAction(`start-${offer.id}`, () => props.updateTravelOfferStatus(offer.id, 'en-curso'), 'Viaje iniciado.')} style={{ ...props.field, padding: '7px 10px', cursor: 'pointer' }}>Iniciar viaje</button>
                )}
                {offer.status === 'en-curso' && (
                  <button onClick={() => props.runTripAction(`complete-${offer.id}`, () => props.updateTravelOfferStatus(offer.id, 'completada'), 'Viaje marcado como completado.')} style={{ ...props.field, padding: '7px 10px', cursor: 'pointer' }}>Completar viaje</button>
                )}
                {offer.status === 'oferta-activa' && (
                  <button onClick={() => props.runTripAction(`cancel-${offer.id}`, () => props.updateTravelOfferStatus(offer.id, 'cancelada'), 'Oferta cancelada.')} style={{ ...props.field, padding: '7px 10px', cursor: 'pointer' }}>Cancelar oferta</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 24 }}>Mis solicitudes</h3>
        {!props.tripLoading && !props.tripError && props.myTripData.requests.length === 0 && <div style={{ color: '#cbd5e1' }}>No has solicitado cupos.</div>}
        <div style={{ display: 'grid', gap: 10 }}>
          {props.myTripData.requests.map((tripRequest) => (
            <div key={tripRequest.id} style={{ background: 'rgba(59,130,246,.08)', borderRadius: 12, padding: 14 }}>
              <div>{tripRequest.offer.owner} • {tripRequest.offer.origin} → {tripRequest.offer.destination} • {tripRequest.offer.departure_date} {tripRequest.offer.departure_time}</div>
              <div style={{ color: '#cbd5e1', marginTop: 4 }}>Solicitud: {props.tripStatusLabels[tripRequest.status] || tripRequest.status} • Viaje: {props.tripStatusLabels[tripRequest.offer.status] || tripRequest.offer.status}</div>
              {['pending', 'accepted'].includes(tripRequest.status) && tripRequest.offer.status === 'oferta-activa' && (
                <button onClick={() => props.runTripAction(`withdraw-${tripRequest.id}`, () => props.updateTravelRequest(tripRequest.id, 'cancelled'), tripRequest.status === 'accepted' ? 'Participación cancelada y cupo liberado.' : 'Solicitud cancelada.')} style={{ ...props.field, marginTop: 8, padding: '7px 10px', cursor: 'pointer' }}>
                  {tripRequest.status === 'accepted' ? 'Cancelar participación' : 'Cancelar solicitud'}
                </button>
              )}
            </div>
          ))}
        </div>
        {['admin', 'security'].includes(props.authUser?.role) && (
          <div style={{ marginTop: 18, color: '#cbd5e1' }}>
            La vista de alertas de emergencia está disponible para cuentas de seguridad y administración activas.
          </div>
        )}
        {props.authUser?.role === 'student' && (
          <div style={{ marginTop: 22, borderTop: '1px solid rgba(148,163,184,.2)', paddingTop: 18 }}>
            <h3 style={{ marginTop: 0 }}>Seguridad del viaje en curso</h3>
            {props.safetyTripOptions.length === 0 ? (
              <div style={{ color: '#cbd5e1' }}>No tienes viajes en curso con participantes aceptados.</div>
            ) : (
              <>
                <label style={{ display: 'grid', gap: 6, color: '#dbeafe' }}>
                  Viaje
                  <select
                    value={props.selectedSafetyTripId}
                    onChange={async (event) => {
                      const nextTripId = event.target.value;
                      if (props.sharingTripLocation && props.selectedSafetyTripId) {
                        try {
                          await props.tripLocationUpdateRef.current;
                          await props.stopSharingTripLocation(props.selectedSafetyTripId);
                          props.setSharingTripLocation(false);
                        } catch (error) {
                          props.setSafetyError(error.message || 'No fue posible detener el GPS antes de cambiar de viaje.');
                          return;
                        }
                      }
                      props.setSelectedSafetyTripId(nextTripId);
                    }}
                    style={props.field}
                  >
                    {props.safetyTripOptions.map((trip) => <option key={`${trip.id}-${trip.label}`} value={trip.id}>{trip.label}</option>)}
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button
                    disabled={props.safetyActionLoading === 'share-location'}
                    onClick={props.sharingTripLocation ? props.stopTripLocationSharing : props.startTripLocationSharing}
                    style={{ ...props.field, cursor: 'pointer' }}
                  >
                    {props.safetyActionLoading === 'share-location'
                      ? 'Obteniendo GPS…'
                      : props.safetyActionLoading === 'stop-sharing'
                        ? 'Retirando ubicación…'
                      : props.sharingTripLocation
                        ? 'Dejar de compartir ubicación'
                        : 'Compartir mi ubicación con este viaje'}
                  </button>
                  <button
                    disabled={props.safetyActionLoading === 'check-in-departure' || props.tripSafetyStatus.check_ins.some((item) => item.user_id === props.authUser.id && item.type === 'departure')}
                    onClick={() => props.recordTripCheckIn('departure')}
                    style={{ ...props.field, cursor: 'pointer' }}
                  >
                    Confirmar salida
                  </button>
                  <button
                    disabled={props.safetyActionLoading === 'check-in-arrival' || props.tripSafetyStatus.check_ins.some((item) => item.user_id === props.authUser.id && item.type === 'arrival')}
                    onClick={() => props.recordTripCheckIn('arrival')}
                    style={{ ...props.field, cursor: 'pointer' }}
                  >
                    Confirmar llegada
                  </button>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>
                  El GPS se comparte solo mientras esta pantalla está abierta y el seguimiento está activo. Se actualiza cada 15 segundos, desaparece del panel tras 2 minutos sin actualización y se elimina al completar o cancelar el viaje.
                </p>
                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  {props.tripSafetyStatus.locations.map((location) => (
                    <div key={location.user_id} style={{ borderRadius: 10, padding: 10, background: 'rgba(59,130,246,.08)' }}>
                      <div>{location.name} • ubicación actual</div>
                      <a href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#93c5fd' }}>
                        Ver ubicación en el mapa
                      </a>
                      <div style={{ color: '#94a3b8', fontSize: 11 }}>Actualizada: {new Date(location.captured_at).toLocaleTimeString()}</div>
                    </div>
                  ))}
                  {props.tripSafetyStatus.check_ins.map((checkIn) => (
                    <div key={`${checkIn.user_id}-${checkIn.type}`} style={{ borderRadius: 10, padding: 10, background: 'rgba(16,185,129,.08)' }}>
                      {checkIn.name} • {checkIn.type === 'departure' ? 'Salida confirmada' : 'Llegada confirmada'} • {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                    </div>
                  ))}
                  {props.tripSafetyStatus.safety_events.map((safetyEvent) => (
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
        <form onSubmit={props.submitTripOffer} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <label style={{ display: 'grid', gap: 6 }}>Origen<input required maxLength={120} value={props.tripOfferForm.origin} onChange={(event) => props.setTripOfferForm((current) => ({ ...current, origin: event.target.value }))} style={props.field} /></label>
          <label style={{ display: 'grid', gap: 6 }}>Destino<input required maxLength={120} value={props.tripOfferForm.destination} onChange={(event) => props.setTripOfferForm((current) => ({ ...current, destination: event.target.value }))} style={props.field} /></label>
          <label style={{ display: 'grid', gap: 6 }}>Fecha de salida<input required type="date" min={props.tripOfferMinimumDate} value={props.tripOfferForm.departure_date} onChange={(event) => props.setTripOfferForm((current) => ({ ...current, departure_date: event.target.value }))} style={props.field} /></label>
          <label style={{ display: 'grid', gap: 6 }}>Hora de salida<input required type="time" value={props.tripOfferForm.departure_time} onChange={(event) => props.setTripOfferForm((current) => ({ ...current, departure_time: event.target.value }))} style={props.field} /></label>
          <label style={{ display: 'grid', gap: 6 }}>Transporte<input required maxLength={80} value={props.tripOfferForm.mode} onChange={(event) => props.setTripOfferForm((current) => ({ ...current, mode: event.target.value }))} style={props.field} /></label>
          <label style={{ display: 'grid', gap: 6 }}>Cupos<input required type="number" min="1" max="20" value={props.tripOfferForm.seats} onChange={(event) => props.setTripOfferForm((current) => ({ ...current, seats: event.target.value }))} style={props.field} /></label>
          <label style={{ display: 'grid', gap: 6 }}>Aporte por persona<input required maxLength={40} value={props.tripOfferForm.cost} onChange={(event) => props.setTripOfferForm((current) => ({ ...current, cost: event.target.value }))} style={props.field} /></label>
          <div role="note" style={{ color: '#fde68a', background: 'rgba(120,53,15,.25)', padding: 12, borderRadius: 10 }}>
            La geocerca automática está temporalmente desactivada: el servidor no valida de forma independiente las rutas calculadas en el navegador. El seguimiento GPS durante un viaje sigue disponible con consentimiento explícito.
          </div>
          <button disabled={props.tripActionLoading === 'create'} type="submit" style={{ border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}>
            {props.tripActionLoading === 'create' ? 'Publicando…' : 'Publicar oferta'}
          </button>
        </form>
        <button onClick={props.calculateTravelCost} style={{ marginTop: 12, border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, background: '#0f172a', color: '#fff', padding: '10px 12px', fontWeight: 800 }}>Calcular costo estimado de ruta</button>
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
  );
}
