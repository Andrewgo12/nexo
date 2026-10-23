import { useMemo } from 'react';
import {
  buildRouteSummary,
  calculateTravelAffinityScore,
  filterTravelMatches,
  validateInstitutionalEmail,
} from '../services/viajauCore';
import { buildDashboardOverview } from '../services/dashboardOverview';

export default function useAppViewModel(state) {
  const {
    adminDashboard,
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
  const searchFilters = useMemo(() => ({
    zone: searchState.zone,
    time: searchState.time,
    faculty: searchState.faculty,
    university: searchState.university,
    transport: searchState.transport,
    date_from: searchState.date_from,
    date_to: searchState.date_to,
  }), [
    searchState.date_from,
    searchState.date_to,
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
  const summaryCards = useMemo(() => buildDashboardOverview({
    emailVerified: isEmailVerified,
    validEmail,
    emailDomain: uni.domain,
    routeMode: route.mode,
    routeResult,
    routeSummary: summary,
  }), [isEmailVerified, validEmail, uni.domain, route.mode, routeResult, summary]);

  return {
    validEmail,
    insuranceMonthlyBudget: insuranceProducts[0]?.monthly_budget_cop ?? 30000,
    safetyTripOptions,
    searchFilters,
    summary,
    searchCandidates,
    filteredResults,
    hasAdminDashboardAccess,
    currentAdminDashboard,
    summaryCards,
  };
}
