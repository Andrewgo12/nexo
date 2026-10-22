import { useMemo } from 'react';
import {
  buildDashboardMetrics,
  buildRouteSummary,
  buildSafetyMatrix,
  calculateTravelAffinityScore,
  calculateTravelReadiness,
  filterTravelMatches,
  getRouteModeKey,
  validateInstitutionalEmail,
} from '../services/viajauCore';

export default function useAppViewModel(state) {
  const {
    adminDashboard,
    alertFeed,
    authUser,
    email,
    insuranceProducts,
    isEmailVerified,
    isLoggedIn,
    route,
    routeResult,
    safetyTripData,
    searchResults,
    searchState,
    student,
    tripCards,
    tripGeofencePreview,
    tripOfferForm,
    uni,
  } = state;

  const validEmail = useMemo(() => validateInstitutionalEmail(email, uni.domain), [email, uni]);
  const safetyTripOptions = useMemo(() => [
    ...safetyTripData.offers
      .filter((trip) => trip.status === 'en-curso')
      .map((trip) => ({ id: trip.id, label: `${trip.origin} → ${trip.destination} (responsable)` })),
    ...safetyTripData.requests
      .filter((request) => request.status === 'accepted' && request.offer.status === 'en-curso')
      .map((request) => ({
        id: request.offer.id,
        label: `${request.offer.origin} → ${request.offer.destination} (${request.offer.owner})`,
      })),
  ], [safetyTripData]);
  const geofenceRouteFingerprint = JSON.stringify([
    tripOfferForm.origin,
    tripOfferForm.destination,
    tripOfferForm.departure_date,
    tripOfferForm.mode,
    tripOfferForm.safety_route_duration_minutes,
  ]);
  const hasCurrentGeofencePreview = tripGeofencePreview?.fingerprint === geofenceRouteFingerprint;
  const readiness = useMemo(() => calculateTravelReadiness(student, route), [student, route]);
  const dashboardMetrics = useMemo(
    () => buildDashboardMetrics(student, route, tripCards, alertFeed),
    [student, route, tripCards, alertFeed],
  );
  const safetyMatrix = useMemo(() => buildSafetyMatrix(student), [student]);
  const searchFilters = useMemo(() => ({
    zone: searchState.zone,
    time: searchState.time,
    faculty: searchState.faculty,
    university: searchState.university,
    transport: searchState.transport,
  }), [
    searchState.faculty,
    searchState.time,
    searchState.transport,
    searchState.university,
    searchState.zone,
  ]);
  const summary = useMemo(() => {
    if (!routeResult) return { duration: 'Pendiente', distance: 'Pendiente', safety: 'No evaluado' };
    const routeSummary = buildRouteSummary({
      origin: route.origin,
      destination: route.destination,
      mode: route.mode,
      routeResult,
    });
    return {
      ...routeSummary,
      duration: Number.isFinite(routeResult.durationMin) ? routeSummary.duration : 'Horario no disponible',
    };
  }, [route, routeResult]);
  const searchCandidates = useMemo(() => searchResults.map((offer) => ({
    ...offer,
    score: calculateTravelAffinityScore(student, offer),
  })), [searchResults, student]);
  const filteredResults = useMemo(
    () => filterTravelMatches(searchState, searchCandidates),
    [searchCandidates, searchState],
  );
  const hasAdminDashboardAccess = isLoggedIn
    && isEmailVerified
    && ['admin', 'university'].includes(authUser?.role);
  const currentAdminDashboard = hasAdminDashboardAccess && (
    adminDashboard?.scope?.global
      ? authUser?.role === 'admin'
      : authUser?.role === 'university'
        && adminDashboard?.scope?.university === (authUser?.university || null)
  ) ? adminDashboard : null;
  const summaryCards = useMemo(() => [
    { key: 'validacion', title: 'Validación institucional', value: dashboardMetrics.validation, detail: `Correo ${uni.domain} verificado`, tone: '#34d399' },
    { key: 'ruta', title: 'Ruta más segura', value: summary.duration, detail: `${route.origin} → ${route.destination}`, tone: '#60a5fa' },
    { key: 'compatibilidad', title: 'Compatibilidad media', value: dashboardMetrics.compatibility, detail: `${readiness.status} • ${getRouteModeKey(route.mode)}`, tone: '#a7f3d0' },
    { key: 'seguridad', title: 'Seguimiento activo', value: safetyMatrix.risk, detail: `${safetyMatrix.confidence} de confianza de seguridad`, tone: '#fca5a5' },
  ], [dashboardMetrics, uni.domain, summary.duration, route.origin, route.destination, readiness.status, route.mode, safetyMatrix]);

  return {
    validEmail,
    insuranceMonthlyBudget: insuranceProducts[0]?.monthly_budget_cop ?? 30000,
    safetyTripOptions,
    geofenceRouteFingerprint,
    hasCurrentGeofencePreview,
    readiness,
    dashboardMetrics,
    safetyMatrix,
    searchFilters,
    summary,
    searchCandidates,
    filteredResults,
    hasAdminDashboardAccess,
    currentAdminDashboard,
    summaryCards,
  };
}
