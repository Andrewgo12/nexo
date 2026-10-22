import { useEffect } from 'react';
import { getAuthToken, getAdminDashboard, getAdminUsers, getAdminIncidents, getInstitutionalCatalog, getLatestTransitFeed } from '../services/authApi';

export default function useAdminEffects(state) {
  const { active, adminIncidentPage, adminIncidentStatus, adminManagementRefresh, adminSelectedUniversity, adminUserFilters, authUser, isEmailVerified, isLoggedIn, setAdminCatalog, setAdminDashboard, setAdminDashboardError, setAdminDashboardLoading, setAdminIncidentMeta, setAdminIncidents, setAdminLatestFeed, setAdminManagementError, setAdminManagementLoading, setAdminSelectedUniversity, setAdminUserMeta, setAdminUsers } = state;

  useEffect(() => {
      const canViewAdminDashboard = active === 'admin'
        && isLoggedIn
        && isEmailVerified
        && ['admin', 'university'].includes(authUser?.role);
      if (!canViewAdminDashboard) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const loadDashboard = async () => {
        setAdminDashboardLoading(true);
        setAdminDashboardError('');
        try {
          const response = await getAdminDashboard(getAuthToken(), controller.signal);
          if (!response.stats || !response.distribution) {
            throw new Error('El servidor devolvió métricas administrativas inválidas.');
          }
          if (!cancelled) setAdminDashboard(response);
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setAdminDashboard(null);
            setAdminDashboardError(error.message || 'No fue posible cargar las métricas administrativas.');
          }
        } finally {
          if (!cancelled) setAdminDashboardLoading(false);
        }
      };
      loadDashboard();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, authUser?.role, isEmailVerified, isLoggedIn, setAdminDashboard, setAdminDashboardError, setAdminDashboardLoading]);

  useEffect(() => {
      if (authUser?.role === 'university' && authUser.university) {
        setAdminSelectedUniversity(authUser.university);
      }
    }, [authUser?.role, authUser?.university, setAdminSelectedUniversity]);

  useEffect(() => {
      if (
        active !== 'admin'
        || !isLoggedIn
        || !isEmailVerified
        || !['admin', 'university'].includes(authUser?.role)
      ) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const loadAdminManagement = async () => {
        setAdminManagementLoading(true);
        setAdminManagementError('');
        try {
          const [usersResponse, incidentsResponse, catalogResponse] = await Promise.all([
            getAdminUsers(adminUserFilters, getAuthToken(), controller.signal),
            getAdminIncidents(adminIncidentStatus, getAuthToken(), controller.signal, adminIncidentPage),
            authUser?.role === 'university' || adminSelectedUniversity
              ? getInstitutionalCatalog(
                authUser?.role === 'university' ? undefined : adminSelectedUniversity,
                getAuthToken(),
                controller.signal,
              )
              : Promise.resolve({ data: [] }),
          ]);
          if (!Array.isArray(usersResponse.data) || !Array.isArray(incidentsResponse.data) || !Array.isArray(catalogResponse.data)) {
            throw new Error('El servidor devolvió datos administrativos inválidos.');
          }
          if (!cancelled) {
            setAdminUsers(usersResponse.data);
            setAdminUserMeta(usersResponse.meta);
            setAdminIncidents(incidentsResponse.data);
            setAdminIncidentMeta(incidentsResponse.meta);
            setAdminCatalog(catalogResponse.data);
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setAdminManagementError(error.message || 'No fue posible cargar la gestión administrativa.');
          }
        } finally {
          if (!cancelled) setAdminManagementLoading(false);
        }
      };
      loadAdminManagement();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, adminManagementRefresh, adminIncidentStatus, adminIncidentPage, adminSelectedUniversity, adminUserFilters, authUser?.role, isEmailVerified, isLoggedIn, setAdminManagementError, setAdminUsers, setAdminIncidentMeta, setAdminIncidents, setAdminUserMeta, setAdminCatalog, setAdminManagementLoading]);

  useEffect(() => {
      if (active !== 'admin' || authUser?.role !== 'admin' || !isLoggedIn || !isEmailVerified) return undefined;
      const controller = new AbortController();
      let cancelled = false;
      getLatestTransitFeed(getAuthToken(), controller.signal)
        .then((response) => {
          if (!cancelled) setAdminLatestFeed(response.data || null);
        })
        .catch((error) => {
          if (!cancelled && error.name !== 'AbortError') {
            setAdminManagementError(error.message || 'No fue posible consultar el último feed GTFS.');
          }
        });

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, adminManagementRefresh, authUser?.role, isEmailVerified, isLoggedIn, setAdminLatestFeed, setAdminManagementError]);
}
