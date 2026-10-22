import { useEffect } from 'react';
import { getAuthToken, getMyReputation, getAdminReports, getMyMembership, getInsuranceProducts, getMyInsuranceEnrollments, getAdminInsuranceEnrollments, getMyTrips, getCommunicationTrips, getTripMessages } from '../services/authApi';

export default function useAccountDataEffects(state) {
  const { active, adminReportsPage, authUser, insuranceRefresh, isEmailVerified, isLoggedIn, reputationRefresh, selectedChatTripId, setAdminInsuranceEnrollments, setAdminReports, setAdminReportsMeta, setChatError, setChatLoading, setChatMessages, setChatReadOnly, setDashboardConversations, setDashboardError, setDashboardLoading, setDashboardReputation, setDashboardTrips, setInsuranceError, setInsuranceLoading, setInsuranceProducts, setMembershipInfo, setMyInsuranceEnrollments, setReputationData, setReputationError, setReputationLoading, setSelectedChatTripId, tripRefreshKey } = state;

  useEffect(() => {
    setDashboardTrips({ offers: [], requests: [] });
    setDashboardConversations([]);
    setDashboardReputation(null);
    setDashboardError('');
    setDashboardLoading(false);
    setReputationData(null);
    setReputationError('');
    setReputationLoading(false);
    setAdminReports([]);
    setAdminReportsMeta({ current_page: 1, last_page: 1, total: 0 });
    setInsuranceProducts([]);
    setMyInsuranceEnrollments([]);
    setMembershipInfo(null);
    setAdminInsuranceEnrollments([]);
    setInsuranceError('');
    setInsuranceLoading(false);
    setSelectedChatTripId('');
    setChatMessages([]);
    setChatReadOnly(false);
    setChatError('');
    setChatLoading(false);
  }, [
    authUser?.id,
    authUser?.role,
    setAdminInsuranceEnrollments,
    setAdminReports,
    setAdminReportsMeta,
    setChatError,
    setChatLoading,
    setChatMessages,
    setChatReadOnly,
    setDashboardConversations,
    setDashboardError,
    setDashboardLoading,
    setDashboardReputation,
    setDashboardTrips,
    setInsuranceError,
    setInsuranceLoading,
    setInsuranceProducts,
    setMembershipInfo,
    setMyInsuranceEnrollments,
    setReputationData,
    setReputationError,
    setReputationLoading,
    setSelectedChatTripId,
  ]);

  useEffect(() => {
      if (active !== 'trust' || !isLoggedIn || !isEmailVerified) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const loadReputation = async () => {
        setReputationLoading(true);
        setReputationError('');
        try {
          const [reputationResponse, reportsResponse] = await Promise.all([
            authUser?.role === 'student'
              ? getMyReputation(getAuthToken(), controller.signal)
              : Promise.resolve({ data: null }),
            authUser?.role === 'admin'
              ? getAdminReports('open', getAuthToken(), controller.signal, adminReportsPage)
              : Promise.resolve({ data: [] }),
          ]);
          if (!cancelled) {
            setReputationData(reputationResponse.data);
            setAdminReports(reportsResponse.data);
            setAdminReportsMeta(reportsResponse.meta || { current_page: 1, last_page: 1, total: reportsResponse.data.length });
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setReputationError(error.message || 'No fue posible cargar la reputación y los reportes.');
          }
        } finally {
          if (!cancelled) setReputationLoading(false);
        }
      };
      loadReputation();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, adminReportsPage, authUser?.id, authUser?.role, isEmailVerified, isLoggedIn, reputationRefresh, setReputationError, setReputationData, setAdminReports, setReputationLoading, setAdminReportsMeta]);

  useEffect(() => {
      if (active !== 'payments' || !isLoggedIn || !isEmailVerified) return undefined;
      if (!['student', 'admin'].includes(authUser?.role)) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const loadInsurance = async () => {
        setInsuranceLoading(true);
        setInsuranceError('');
        try {
          const [productsResponse, studentResponse, membershipResponse, adminResponse] = await Promise.all([
            getInsuranceProducts(getAuthToken(), controller.signal),
            authUser?.role === 'student'
              ? getMyInsuranceEnrollments(getAuthToken(), controller.signal)
              : Promise.resolve({ data: [] }),
            authUser?.role === 'student'
              ? getMyMembership(getAuthToken(), controller.signal)
              : Promise.resolve({ data: null }),
            authUser?.role === 'admin'
              ? getAdminInsuranceEnrollments(getAuthToken(), controller.signal)
              : Promise.resolve({ data: [] }),
          ]);
          if (!cancelled) {
            setInsuranceProducts(productsResponse.data || []);
            setMyInsuranceEnrollments(studentResponse.data || []);
            setMembershipInfo(membershipResponse);
            setAdminInsuranceEnrollments(authUser?.role === 'admin' ? adminResponse.data || [] : []);
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setInsuranceError(error.message || 'No fue posible cargar las cotizaciones de seguro.');
          }
        } finally {
          if (!cancelled) setInsuranceLoading(false);
        }
      };
      loadInsurance();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, authUser?.id, authUser?.role, insuranceRefresh, isEmailVerified, isLoggedIn, setInsuranceError, setInsuranceLoading, setMyInsuranceEnrollments, setMembershipInfo, setAdminInsuranceEnrollments, setInsuranceProducts]);

  useEffect(() => {
      if (active !== 'dashboard' || !isLoggedIn || !isEmailVerified || authUser?.role !== 'student') return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const loadDashboard = async () => {
        setDashboardLoading(true);
        setDashboardError('');
        try {
          const [tripsResponse, conversationsResponse, reputationResponse] = await Promise.all([
            getMyTrips(getAuthToken(), controller.signal),
            getCommunicationTrips(getAuthToken(), controller.signal),
            getMyReputation(getAuthToken(), controller.signal),
          ]);
          if (!Array.isArray(tripsResponse.data?.offers)
            || !Array.isArray(tripsResponse.data?.requests)
            || !Array.isArray(conversationsResponse.data)) {
            throw new Error('El servidor devolvió información de dashboard inválida.');
          }
          if (!cancelled) {
            setDashboardTrips(tripsResponse.data);
            setDashboardConversations(conversationsResponse.data);
            setDashboardReputation(reputationResponse.data || null);
            setSelectedChatTripId((current) => (
              conversationsResponse.data.some((trip) => String(trip.id) === current)
                ? current
                : String(conversationsResponse.data[0]?.id || '')
            ));
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setDashboardError(error.message || 'No fue posible cargar tu dashboard.');
          }
        } finally {
          if (!cancelled) setDashboardLoading(false);
        }
      };
      loadDashboard();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, authUser?.id, authUser?.role, isEmailVerified, isLoggedIn, tripRefreshKey, setDashboardError, setDashboardTrips, setSelectedChatTripId, setDashboardConversations, setDashboardLoading, setDashboardReputation]);

  useEffect(() => {
      if (active !== 'dashboard' || !selectedChatTripId || !isLoggedIn || !isEmailVerified) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      let loading = false;
      const loadChat = async () => {
        if (loading) return;
        loading = true;
        try {
          const response = await getTripMessages(selectedChatTripId, getAuthToken(), controller.signal);
          if (!Array.isArray(response.data)) throw new Error('El servidor devolvió mensajes inválidos.');
          if (!cancelled) {
            setChatMessages(response.data);
            setChatReadOnly(Boolean(response.meta?.read_only));
            setChatError('');
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setChatMessages([]);
            setChatError(error.message || 'No fue posible cargar el chat de este viaje.');
          }
        } finally {
          loading = false;
          if (!cancelled) setChatLoading(false);
        }
      };
      setChatLoading(true);
      loadChat();
      const intervalId = window.setInterval(loadChat, 12000);

      return () => {
        cancelled = true;
        controller.abort();
        window.clearInterval(intervalId);
      };
    }, [active, authUser?.id, isEmailVerified, isLoggedIn, selectedChatTripId, setChatLoading, setChatMessages, setChatReadOnly, setChatError]);
}
