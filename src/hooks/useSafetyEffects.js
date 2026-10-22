import { useEffect } from 'react';
import { getAuthToken, getMyTrips, shareTripLocation, stopSharingTripLocation, getTripSafetyStatus, getSafetyAlerts } from '../services/authApi';
import { getCurrentDeviceLocation } from '../services/locationApi';

export default function useSafetyEffects(state, helpers = {}) {
  const { active, authUser, isEmailVerified, isLoggedIn, safetyRefreshKey, selectedSafetyTripId, setAlertFeed, setSafetyAlertsLoading, setSafetyError, setSafetyRefreshKey, setSafetyTripData, setSelectedSafetyTripId, setSharingTripLocation, setTripSafetyStatus, sharingTripLocation, tripLocationUpdateRef, tripRefreshKey } = state;
  const { safetyTripOptions } = helpers;

  useEffect(() => {
      if (
        active !== 'safety'
        || !isLoggedIn
        || !isEmailVerified
        || !['admin', 'security'].includes(authUser?.role)
      ) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const loadAlerts = async () => {
        setSafetyAlertsLoading(true);
        setSafetyError('');
        try {
          const response = await getSafetyAlerts(getAuthToken(), controller.signal);
          if (!Array.isArray(response.data)) {
            throw new Error('El servidor devolvió una lista de alertas inválida.');
          }
          if (!cancelled) setAlertFeed(response.data);
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setAlertFeed([]);
            setSafetyError(error.message || 'No fue posible cargar las alertas de seguridad.');
          }
        } finally {
          if (!cancelled) setSafetyAlertsLoading(false);
        }
      };
      loadAlerts();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, authUser?.role, isEmailVerified, isLoggedIn, safetyRefreshKey, setSafetyAlertsLoading, setSafetyError, setAlertFeed]);

  useEffect(() => {
      if (active !== 'safety' || !isLoggedIn || !isEmailVerified || authUser?.role !== 'student') {
        setSafetyTripData({ offers: [], requests: [] });
        setSelectedSafetyTripId('');
        return undefined;
      }

      const controller = new AbortController();
      let cancelled = false;
      const loadSafetyTrips = async () => {
        try {
          const response = await getMyTrips(getAuthToken(), controller.signal);
          if (!Array.isArray(response.data?.offers) || !Array.isArray(response.data?.requests)) {
            throw new Error('El servidor devolvió viajes activos inválidos.');
          }
          if (!cancelled) setSafetyTripData(response.data);
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setSafetyTripData({ offers: [], requests: [] });
            setSafetyError(error.message || 'No fue posible cargar tus viajes activos.');
          }
        }
      };
      loadSafetyTrips();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, authUser?.role, isEmailVerified, isLoggedIn, tripRefreshKey, setSafetyTripData, setSafetyError, setSelectedSafetyTripId]);

  useEffect(() => {
      if (!safetyTripOptions.some((trip) => String(trip.id) === String(selectedSafetyTripId))) {
        setSelectedSafetyTripId(safetyTripOptions[0] ? String(safetyTripOptions[0].id) : '');
      }
    }, [safetyTripOptions, selectedSafetyTripId, setSelectedSafetyTripId]);

  useEffect(() => {
      setSharingTripLocation(false);
      setTripSafetyStatus({ locations: [], check_ins: [], safety_events: [] });
    }, [selectedSafetyTripId, setTripSafetyStatus, setSharingTripLocation]);

  useEffect(() => {
      if (active === 'safety' || !sharingTripLocation || !selectedSafetyTripId) return undefined;

      setSharingTripLocation(false);
      const stopSharing = async () => {
        try {
          await tripLocationUpdateRef.current;
        } catch (error) {
          setSafetyError(error.message || 'No fue posible actualizar la ubicación antes de detenerla.');
        }
        try {
          await stopSharingTripLocation(selectedSafetyTripId);
          setSafetyRefreshKey((current) => current + 1);
        } catch (error) {
          setSafetyError(error.message || 'No fue posible retirar tu ubicación del viaje.');
        }
      };
      stopSharing();

      return undefined;
    }, [active, selectedSafetyTripId, sharingTripLocation, setSharingTripLocation, setSafetyError, setSafetyRefreshKey, tripLocationUpdateRef]);

  useEffect(() => {
      if (active !== 'safety' || !isLoggedIn || !isEmailVerified || !selectedSafetyTripId) {
        setTripSafetyStatus({ locations: [], check_ins: [], safety_events: [] });
        return undefined;
      }

      const controller = new AbortController();
      let cancelled = false;
      let loading = false;
      const loadTripSafetyStatus = async () => {
        if (loading) return;
        loading = true;
        try {
          const response = await getTripSafetyStatus(selectedSafetyTripId, getAuthToken(), controller.signal);
          if (
            !Array.isArray(response.data?.locations)
            || !Array.isArray(response.data?.check_ins)
            || !Array.isArray(response.data?.safety_events)
          ) {
            throw new Error('El servidor devolvió el estado de seguridad del viaje inválido.');
          }
          if (!cancelled) setTripSafetyStatus(response.data);
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setTripSafetyStatus({ locations: [], check_ins: [], safety_events: [] });
            setSafetyError(error.message || 'No fue posible consultar el viaje activo.');
          }
        } finally {
          loading = false;
        }
      };
      loadTripSafetyStatus();
      const intervalId = window.setInterval(loadTripSafetyStatus, 15000);

      return () => {
        cancelled = true;
        controller.abort();
        window.clearInterval(intervalId);
      };
    }, [active, isEmailVerified, isLoggedIn, safetyRefreshKey, selectedSafetyTripId, setTripSafetyStatus, setSafetyError]);

  useEffect(() => {
      if (active !== 'safety' || !isLoggedIn || !isEmailVerified || !selectedSafetyTripId || !sharingTripLocation) {
        return undefined;
      }

      let cancelled = false;
      let updating = false;
      const updateLocation = async () => {
        if (cancelled || updating) return;
        updating = true;
        const update = (async () => {
          try {
            const location = await getCurrentDeviceLocation();
            if (cancelled) return;
            await shareTripLocation(selectedSafetyTripId, {
              latitude: location.lat,
              longitude: location.lng,
              ...(location.accuracy !== null && location.accuracy <= 100000
                ? { accuracy_meters: Math.round(location.accuracy) }
                : {}),
            });
            if (!cancelled) setSafetyError('');
          } catch (error) {
            if (!cancelled) {
              setSharingTripLocation(false);
              setSafetyError(error.message || 'No fue posible actualizar tu ubicación compartida.');
            }
          }
        })();
        tripLocationUpdateRef.current = update;
        try {
          await update;
        } finally {
          updating = false;
        }
      };
      updateLocation();
      const intervalId = window.setInterval(updateLocation, 15000);

      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
      };
    }, [active, isEmailVerified, isLoggedIn, selectedSafetyTripId, sharingTripLocation, setSharingTripLocation, setSafetyError, tripLocationUpdateRef]);
}
