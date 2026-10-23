function parseDepartureHour(time) {
  if (typeof time !== 'string') return null;
  const match = /^([01]\d|2[0-3]):[0-5]\d$/.exec(time);
  return match ? Number(match[1]) : null;
}

function normalizeMatchValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase();
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function calculateTravelAffinityScore(student, trip) {
  const studentZone = normalizeMatchValue(student.neighborhood);
  const tripZone = normalizeMatchValue(trip.zone);
  const preferredMode = normalizeMatchValue(student.transport).split(/[+/,]/)[0].trim();
  const tripMode = normalizeMatchValue(trip.transport);
  const shift = normalizeMatchValue(student.shift);
  const hour = parseDepartureHour(trip.time);
  let score = 0;

  if (
    studentZone.length >= 3
    && tripZone
    && new RegExp(`(?:^|[^a-z0-9])${escapeRegularExpression(studentZone)}(?:$|[^a-z0-9])`).test(tripZone)
  ) score += 50;
  if (preferredMode && tripMode.includes(preferredMode)) score += 15;
  if (Number.isFinite(hour) && shift) {
    const shiftMatches = shift.includes('manana') ? hour >= 5 && hour < 12
      : shift.includes('tarde') ? hour >= 12 && hour < 18
        : shift.includes('noche') || shift.includes('noct') ? hour >= 18 || hour < 5
          : false;
    if (shiftMatches) score += 35;
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
    const dateMatch = (!searchState.date_from || item.departure_date >= searchState.date_from) &&
      (!searchState.date_to || item.departure_date <= searchState.date_to);
    return zoneMatch && timeMatch && facultyMatch && universityMatch && transportMatch && dateMatch;
  }).sort((a, b) => {
    if (searchState.sort === 'Hora de salida') {
      const dateOrder = String(a.departure_date || '').localeCompare(String(b.departure_date || ''));
      return dateOrder || String(a.time || '').localeCompare(String(b.time || ''));
    }
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

export function mergeMatchRecommendations(currentRecommendations, incomingRecommendations) {
  const recommendationsById = new Map();
  for (const recommendation of [...currentRecommendations, ...incomingRecommendations]) {
    if (
      !recommendation
      || recommendation.id == null
      || !Number.isFinite(Number(recommendation.score))
    ) {
      throw new TypeError('La recomendación contiene datos inválidos.');
    }
    recommendationsById.set(String(recommendation.id), recommendation);
  }

  return [...recommendationsById.values()].sort((first, second) => {
    const scoreDifference = Number(second.score) - Number(first.score);
    if (scoreDifference) return scoreDifference;

    const firstId = Number(first.id);
    const secondId = Number(second.id);
    if (Number.isSafeInteger(firstId) && Number.isSafeInteger(secondId)) return firstId - secondId;
    return String(first.id).localeCompare(String(second.id));
  });
}
