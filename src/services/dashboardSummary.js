export function buildUpcomingTrips(dashboardTrips, now = Date.now()) {
  const ownedOffers = dashboardTrips.offers;
  const outgoingRequests = dashboardTrips.requests;
  return [
    ...ownedOffers
      .filter((trip) => trip.status === 'oferta-activa')
      .map((trip) => ({ ...trip, role: 'Responsable' })),
    ...outgoingRequests
      .filter((request) => request.status === 'accepted' && request.offer.status === 'oferta-activa')
      .map((request) => ({ ...request.offer, role: 'Pasajero' })),
  ]
    .map((trip) => ({
      ...trip,
      departureAt: trip.departure_date && trip.departure_time
        ? new Date(`${trip.departure_date}T${String(trip.departure_time).slice(0, 5)}:00`).getTime()
        : Number.NaN,
    }))
    .filter((trip) => Number.isFinite(trip.departureAt) && trip.departureAt > now)
    .sort((first, second) => first.departureAt - second.departureAt)
    .filter((trip, index, trips) => (
      trips.findIndex((candidate) => String(candidate.id) === String(trip.id)) === index
    ));
}

export function buildDashboardSummary(dashboardTrips, dashboardReputation, statusLabels) {
  const ownedOffers = dashboardTrips.offers;
  const outgoingRequests = dashboardTrips.requests;
  const activeOffers = ownedOffers.filter((trip) => trip.status === 'oferta-activa');
  const inProgress = ownedOffers.filter((trip) => trip.status === 'en-curso').length
    + outgoingRequests.filter((request) => request.status === 'accepted' && request.offer.status === 'en-curso').length;
  const completed = ownedOffers.filter((trip) => trip.status === 'completada').length
    + outgoingRequests.filter((request) => request.status === 'accepted' && request.offer.status === 'completada').length;
  const pendingRequests = ownedOffers.reduce((count, trip) => (
    count + trip.requests.filter((request) => request.status === 'pending').length
  ), 0) + outgoingRequests.filter((request) => request.status === 'pending').length;
  const rating = dashboardReputation?.summary?.rating_average;
  const ratingCount = dashboardReputation?.summary?.rating_count || 0;
  const activity = [
    ...ownedOffers.flatMap((trip) => trip.requests
      .filter((request) => request.status === 'pending')
      .map((request) => ({
        key: `incoming-${request.id}`,
        label: `Solicitud de cupo de ${request.requester.name}`,
        detail: `${trip.origin} → ${trip.destination}`,
      }))),
    ...outgoingRequests
      .filter((request) => ['accepted', 'rejected'].includes(request.status))
      .map((request) => ({
        key: `outgoing-${request.id}`,
        label: `Tu solicitud fue ${statusLabels[request.status] || request.status.toLowerCase()}`,
        detail: `${request.offer.origin} → ${request.offer.destination}`,
      })),
  ];
  const history = [
    ...ownedOffers.map((trip) => ({
      key: `offer-${trip.id}`,
      route: `${trip.origin} → ${trip.destination}`,
      status: trip.status,
      detail: `Oferta como responsable · ${trip.departure_date || 'Fecha no registrada'} · ${trip.departure_time || 'Hora no registrada'}`,
    })),
    ...outgoingRequests.map((request) => ({
      key: `request-${request.id}`,
      route: `${request.offer.origin} → ${request.offer.destination}`,
      status: request.offer.status === 'completada' ? 'completada' : request.status,
      detail: `Solicitud como pasajero · ${request.offer.departure_date || 'Fecha no registrada'} · ${request.offer.departure_time || 'Hora no registrada'}`,
    })),
  ];
  const upcoming = buildUpcomingTrips(dashboardTrips);

  return {
    metrics: [
      { label: 'Ofertas activas', value: activeOffers.length, color: '#f472b6' },
      { label: 'Viajes en curso', value: inProgress, color: '#c084fc' },
      { label: 'Viajes completados', value: completed, color: '#34d399' },
      { label: 'Solicitudes pendientes', value: pendingRequests, color: '#fbbf24' },
      {
        label: 'Calificación',
        value: rating === null || rating === undefined ? 'Sin calificar' : `${rating}/5 (${ratingCount})`,
        color: '#f9a8d4',
      },
    ],
    activity,
    history,
    upcoming,
  };
}
