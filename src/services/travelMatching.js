export function calculateCompatibilityScore(student, trip) {
  const base = 54;
  const zoneBonus = trip.zone && student.neighborhood ? (String(trip.zone).toLowerCase().includes(String(student.neighborhood).toLowerCase()) ? 22 : 6) : 12;
  const timeBonus = trip.time && String(trip.time).startsWith(String(student.shift || 'Nocturna').slice(0, 2)) ? 12 : 6;
  const routeBonus = trip.transport && student.transport ? (String(trip.transport).toLowerCase().includes(String(student.transport).split(' ')[0].toLowerCase()) ? 10 : 4) : 4;
  const trustBonus = Math.min(18, Number(student.trustScore || 4.8) * 3.5);
  return Math.min(99, Math.max(70, Math.round(base + zoneBonus + timeBonus + routeBonus + trustBonus)));
}

export function calculateTravelAffinityScore(student, trip) {
  const normalized = (value) => String(value || '').trim().toLocaleLowerCase();
  const studentZone = normalized(student.neighborhood);
  const tripZone = normalized(trip.zone);
  const preferredMode = normalized(student.transport).split(/[+/,]/)[0].trim();
  const tripMode = normalized(trip.transport);
  const shift = normalized(student.shift);
  const hour = Number.parseInt(String(trip.time || '').slice(0, 2), 10);
  let score = 0;

  if (studentZone && tripZone && tripZone.includes(studentZone)) score += 40;
  if (preferredMode && tripMode && (tripMode.includes(preferredMode) || preferredMode.includes(tripMode))) score += 30;
  if (Number.isFinite(hour) && shift) {
    const shiftMatches = shift.includes('mañana') ? hour >= 5 && hour < 12
      : shift.includes('tarde') ? hour >= 12 && hour < 18
        : shift.includes('noche') || shift.includes('noct') ? hour >= 18 || hour < 5
          : false;
    if (shiftMatches) score += 30;
  }
  return score;
}

export function filterTravelMatches(searchState, candidates = []) {
  return [...candidates].filter((item) => {
    const normalized = (value) => String(value || '').trim().toLocaleLowerCase();
    const zoneMatch = !searchState.zone || normalized(item.zone).includes(normalized(searchState.zone));
    const timeMatch = !searchState.time || normalized(item.time).startsWith(searchState.time.slice(0, 2));
    const facultyMatch = !searchState.faculty || normalized(item.faculty).includes(normalized(searchState.faculty));
    const universityMatch = !searchState.university || searchState.university === 'Cualquiera' ||
      normalized(item.university).includes(normalized(searchState.university));
    const transportMatch = !searchState.transport || searchState.transport === 'Cualquiera' ||
      normalized(item.transport).includes(normalized(searchState.transport));
    return zoneMatch && timeMatch && facultyMatch && universityMatch && transportMatch;
  }).sort((a, b) => {
    if (searchState.sort === 'Hora de salida') return String(a.time).localeCompare(String(b.time));
    if (searchState.sort === 'Más recientes') {
      const aDate = Date.parse(a.created_at || '');
      const bDate = Date.parse(b.created_at || '');
      if (!Number.isFinite(aDate)) return Number.isFinite(bDate) ? 1 : 0;
      if (!Number.isFinite(bDate)) return -1;
      return bDate - aDate;
    }
    return Number(b.score || 0) - Number(a.score || 0);
  });
}

export function buildMatchRecommendations(student, candidates = []) {
  return candidates.map((candidate) => ({
    traveler: candidate.name,
    score: calculateCompatibilityScore(student, candidate),
    zone: candidate.zone,
    time: candidate.time,
    mode: candidate.transport,
    recommendation: `Afinidad estimada ${calculateCompatibilityScore(student, candidate)}% por barrio, transporte y jornada.`
  }));
}
