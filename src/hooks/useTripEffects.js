import { useEffect } from 'react';
import { getAuthToken, getTravelOffers, getMyTrips } from '../services/authApi';

export default function useTripEffects(state) {
  const { active, isEmailVerified, isLoggedIn, setMyTripData, setTripCards, setTripError, setTripLoading, tripRefreshKey } = state;

  useEffect(() => {
      if (active !== 'trips' || !isLoggedIn || !isEmailVerified) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const loadTrips = async () => {
        setTripLoading(true);
        setTripError('');
        try {
          const token = getAuthToken();
          const [offersResponse, myTripsResponse] = await Promise.all([
            getTravelOffers({}, token, controller.signal),
            getMyTrips(token, controller.signal),
          ]);
          if (!Array.isArray(offersResponse.data) || !Array.isArray(myTripsResponse.data?.offers) || !Array.isArray(myTripsResponse.data?.requests)) {
            throw new Error('El servidor devolvió datos de viajes inválidos.');
          }
          if (!cancelled) {
            setTripCards(offersResponse.data);
            setMyTripData(myTripsResponse.data);
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setTripCards([]);
            setMyTripData({ offers: [], requests: [] });
            setTripError(error.message || 'No fue posible cargar la gestión de viajes.');
          }
        } finally {
          if (!cancelled) setTripLoading(false);
        }
      };
      loadTrips();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [active, isEmailVerified, isLoggedIn, tripRefreshKey, setTripLoading, setTripCards, setTripError, setMyTripData]);
}
