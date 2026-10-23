import { useEffect } from 'react';
import { getAuthToken, getTravelOffers, getMyTrips } from '../services/authApi';

export default function useTripEffects(state) {
  const { active, isEmailVerified, isLoggedIn, setMyTripData, setMyTripsLoadingMore, setMyTripsPagination, setTripCards, setTripCardsHasMore, setTripCardsLoadingMore, setTripCardsNextCursor, setTripError, setTripLoading, tripRefreshKey } = state;

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
          if (
            offersResponse.meta?.truncated
            && (!Number.isSafeInteger(offersResponse.meta.next_after_id) || offersResponse.meta.next_after_id <= 0)
          ) {
            throw new Error('El servidor devolvió un cursor inválido para la siguiente página de ofertas.');
          }
          const myTripsMeta = myTripsResponse.meta || {};
          if (
            (myTripsMeta.offers_has_older
              && (!Number.isSafeInteger(myTripsMeta.offers_before_id) || myTripsMeta.offers_before_id <= 0))
            || (myTripsMeta.requests_has_older
              && (!Number.isSafeInteger(myTripsMeta.requests_before_id) || myTripsMeta.requests_before_id <= 0))
          ) {
            throw new Error('El servidor devolvió cursores inválidos para el historial de viajes.');
          }
          if (!cancelled) {
            setTripCards(offersResponse.data);
            setTripCardsHasMore(Boolean(offersResponse.meta?.truncated) && Number.isSafeInteger(offersResponse.meta?.next_after_id));
            setTripCardsNextCursor(Number.isSafeInteger(offersResponse.meta?.next_after_id)
              ? offersResponse.meta.next_after_id
              : null);
            setTripCardsLoadingMore(false);
            setMyTripData(myTripsResponse.data);
            setMyTripsPagination({
              offersHasOlder: Boolean(myTripsMeta.offers_has_older),
              offersBeforeId: Number.isSafeInteger(myTripsMeta.offers_before_id) ? myTripsMeta.offers_before_id : null,
              requestsHasOlder: Boolean(myTripsMeta.requests_has_older),
              requestsBeforeId: Number.isSafeInteger(myTripsMeta.requests_before_id) ? myTripsMeta.requests_before_id : null,
            });
            setMyTripsLoadingMore({ offers: false, requests: false });
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setTripCards([]);
            setTripCardsHasMore(false);
            setTripCardsNextCursor(null);
            setTripCardsLoadingMore(false);
            setMyTripData({ offers: [], requests: [] });
            setMyTripsPagination({
              offersHasOlder: false,
              offersBeforeId: null,
              requestsHasOlder: false,
              requestsBeforeId: null,
            });
            setMyTripsLoadingMore({ offers: false, requests: false });
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
    }, [active, isEmailVerified, isLoggedIn, tripRefreshKey, setTripLoading, setTripCards, setTripCardsHasMore, setTripCardsNextCursor, setTripCardsLoadingMore, setTripError, setMyTripData, setMyTripsPagination, setMyTripsLoadingMore]);
}
