export function createTravelOffer(student, route) {
  return {
    driver: student.name,
    route: `${route.origin || 'UNIAJC'} → ${route.destination || 'El Caney'}`,
    seats: 2,
    cost: '2500 COP',
    status: 'Oferta nueva',
    createdAt: new Date().toISOString()
  };
}

export function requestTripSeat(trips = [], index = 0) {
  return trips.map((trip, tripIndex) => {
    if (tripIndex === index && trip.seats > 0) {
      return { ...trip, seats: trip.seats - 1, status: 'Cupo solicitado' };
    }
    return trip;
  });
}

export function calculateTripCost(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new Error('Calcula una ruta válida antes de estimar el aporte.');
  }
  const total = Math.round(distanceKm * 380 + 1500);
  return {
    totalCop: total,
    formatted: `${total.toLocaleString('es-CO')} COP`,
  };
}

export function createEmergencyAlert(type, studentName) {
  return {
    type,
    detail: `${type} activado por ${studentName}. Contacto de confianza y autoridades notificadas.`,
    state: 'Activo',
    createdAt: new Date().toISOString()
  };
}

export function updateTravelStatus(trips = [], index, status) {
  return trips.map((trip, tripIndex) => tripIndex === index ? { ...trip, status } : trip);
}

export function createChatMessage(sender, text) {
  return {
    sender,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export function buildTravelSearchCandidates() {
  return [
    { name: 'Ana Vélez', zone: 'El Caney', time: '19:45', faculty: 'Ingeniería', transport: 'MIO + caminata', score: 96, safety: 'Alta', gender: 'Mujer' },
    { name: 'Daniela Carmona', zone: 'El Caney', time: '19:50', faculty: 'Ingeniería', transport: 'MIO', score: 92, safety: 'Alta', gender: 'Mujer' },
    { name: 'Santiago Rojas', zone: 'Pance', time: '20:10', faculty: 'Diseño', transport: 'Carro', score: 86, safety: 'Media', gender: 'Hombre' }
  ];
}
