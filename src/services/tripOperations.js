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
