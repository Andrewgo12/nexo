import { useRef } from 'react';
import { createTripCheckIn, getAuthToken, getMyTrips, getTravelOffers, publishTravelOffer, shareTripLocation, stopSharingTripLocation } from '../services/authApi';
import { getCurrentDeviceLocation } from '../services/locationApi';
import { calculateTripCost } from '../services/viajauCore';

export default function useTripActions(state) {
  const { active, routeResult, selectedSafetyTripId, setSafetyActionLoading, setSafetyError, setSafetyRefreshKey, setSharingTripLocation, setToast, setTripActionLoading, setTripError, setTripRefreshKey, tripLocationUpdateRef, tripOfferForm } = state;
  const loadingMoreOffersRef = useRef(false);
  const loadingMyTripsPagesRef = useRef(new Set());

  const runTripAction = async (loadingKey, operation, successMessage) => {
      setTripActionLoading(loadingKey);
      setTripError('');
      try {
        await operation();
        setTripRefreshKey((current) => current + 1);
        setToast(successMessage);
      } catch (error) {
        setTripError(error.message || 'No se pudo actualizar el viaje.');
      } finally {
        setTripActionLoading('');
      }
    }

  const submitTripOffer = async (event) => {
      event.preventDefault();
      setTripActionLoading('create');
      setTripError('');
      try {
        await publishTravelOffer({
          ...tripOfferForm,
          seats: Number(tripOfferForm.seats),
        });
        setTripRefreshKey((current) => current + 1);
        setToast('Oferta publicada. La geocerca automática no se activa hasta que el servidor valide el trazado de forma independiente.');
      } catch (error) {
        setTripError(error.message || 'No se pudo publicar la oferta.');
      } finally {
        setTripActionLoading('');
      }
    }

  const loadMoreTripCards = async () => {
    const cursor = state.tripCardsNextCursor;
    if (!state.tripCardsHasMore || !Number.isSafeInteger(cursor) || cursor <= 0
      || state.tripCardsLoadingMore || loadingMoreOffersRef.current) return;

    loadingMoreOffersRef.current = true;
    state.setTripCardsLoadingMore(true);
    setTripError('');
    try {
      const response = await getTravelOffers({ after_id: cursor });
      if (!Array.isArray(response.data)) {
        throw new Error('El servidor devolvió una página de ofertas inválida.');
      }
      const nextCursor = response.meta?.next_after_id;
      if (response.meta?.truncated && (!Number.isSafeInteger(nextCursor) || nextCursor <= cursor)) {
        throw new Error('El servidor devolvió un cursor inválido para la siguiente página de ofertas.');
      }
      const existingIds = new Set(state.tripCards.map((offer) => String(offer.id)));
      const nextOffers = response.data.filter((offer) => !existingIds.has(String(offer.id)));
      if (response.meta?.truncated && nextOffers.length === 0) {
        throw new Error('El servidor indicó más ofertas, pero la página no contiene resultados nuevos.');
      }
      state.setTripCards((current) => {
        const offersById = new Map(current.map((offer) => [String(offer.id), offer]));
        for (const offer of nextOffers) offersById.set(String(offer.id), offer);
        return [...offersById.values()];
      });
      const hasMore = Boolean(response.meta?.truncated);
      state.setTripCardsNextCursor(hasMore ? nextCursor : null);
      state.setTripCardsHasMore(hasMore);
    } catch (error) {
      setTripError(error.message || 'No fue posible cargar más ofertas.');
    } finally {
      loadingMoreOffersRef.current = false;
      state.setTripCardsLoadingMore(false);
    }
  };

  const loadMoreMyTrips = async (kind) => {
    if (!['offers', 'requests'].includes(kind)) {
      throw new RangeError('El tipo de historial de viajes no es válido.');
    }
    const hasOlderKey = kind === 'offers' ? 'offersHasOlder' : 'requestsHasOlder';
    const beforeIdKey = kind === 'offers' ? 'offersBeforeId' : 'requestsBeforeId';
    const pagination = state.myTripsPagination;
    const cursor = pagination[beforeIdKey];
    if (!pagination[hasOlderKey]
      || !Number.isSafeInteger(cursor)
      || cursor <= 0
      || state.myTripsLoadingMore[kind]
      || loadingMyTripsPagesRef.current.has(kind)) return;

    loadingMyTripsPagesRef.current.add(kind);
    state.setMyTripsLoadingMore((current) => ({ ...current, [kind]: true }));
    setTripError('');
    try {
      const cursors = kind === 'offers'
        ? { offersBeforeId: cursor }
        : { requestsBeforeId: cursor };
      const response = await getMyTrips(getAuthToken(), undefined, cursors);
      if (!Array.isArray(response.data?.[kind])) {
        throw new Error('El servidor devolvió una página de historial inválida.');
      }
      const hasOlder = Boolean(response.meta?.[hasOlderKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)]);
      const nextBeforeId = response.meta?.[beforeIdKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)];
      if (hasOlder && (!Number.isSafeInteger(nextBeforeId) || nextBeforeId <= 0 || nextBeforeId >= cursor)) {
        throw new Error('El servidor devolvió un cursor inválido para el historial de viajes.');
      }
      const existingIds = new Set(state.myTripData[kind].map((item) => String(item.id)));
      const nextPage = response.data[kind].filter((item) => !existingIds.has(String(item.id)));
      if (hasOlder && nextPage.length === 0) {
        throw new Error('El servidor indicó más historial, pero la página no contiene resultados nuevos.');
      }
      state.setMyTripData((current) => {
        const entriesById = new Map(current[kind].map((item) => [String(item.id), item]));
        for (const item of nextPage) entriesById.set(String(item.id), item);
        return {
          ...current,
          [kind]: [...entriesById.values()].sort((first, second) => Number(second.id) - Number(first.id)),
        };
      });
      state.setMyTripsPagination((current) => ({
        ...current,
        [hasOlderKey]: hasOlder,
        [beforeIdKey]: hasOlder ? nextBeforeId : null,
      }));
    } catch (error) {
      setTripError(error.message || 'No fue posible cargar más historial de viajes.');
    } finally {
      loadingMyTripsPagesRef.current.delete(kind);
      state.setMyTripsLoadingMore((current) => ({ ...current, [kind]: false }));
    }
  };

  const stopTripLocationSharing = async (tripId = selectedSafetyTripId) => {
      if (!tripId) return;
      setSharingTripLocation(false);
      setSafetyActionLoading('stop-sharing');
      setSafetyError('');
      try {
        try {
          await tripLocationUpdateRef.current;
        } catch (error) {
          setSafetyError(error.message || 'No fue posible actualizar la ubicación antes de detenerla.');
        }
        await stopSharingTripLocation(tripId);
        setSafetyRefreshKey((current) => current + 1);
        setToast('Tu ubicación fue retirada del viaje.');
      } catch (error) {
        setSafetyError(error.message || 'No fue posible retirar tu ubicación del viaje.');
      } finally {
        setSafetyActionLoading('');
      }
    }

  const startTripLocationSharing = async () => {
      if (!selectedSafetyTripId) return;
      const tripId = selectedSafetyTripId;
      setSafetyActionLoading('share-location');
      setSafetyError('');
      try {
        const location = await getCurrentDeviceLocation();
        if (tripId !== selectedSafetyTripId || active !== 'safety') return;
        await shareTripLocation(tripId, {
          latitude: location.lat,
          longitude: location.lng,
          ...(location.accuracy !== null && location.accuracy <= 100000
            ? { accuracy_meters: Math.round(location.accuracy) }
            : {}),
        });
        setSharingTripLocation(true);
        setSafetyRefreshKey((current) => current + 1);
        setToast('Ubicación compartida con los participantes de este viaje mientras mantengas el seguimiento activo.');
      } catch (error) {
        setSafetyError(error.message || 'No fue posible iniciar el seguimiento de ubicación.');
      } finally {
        setSafetyActionLoading('');
      }
    }

  const recordTripCheckIn = async (type) => {
      if (!selectedSafetyTripId) return;
      setSafetyActionLoading(`check-in-${type}`);
      setSafetyError('');
      try {
        await createTripCheckIn(selectedSafetyTripId, type);
        setSafetyRefreshKey((current) => current + 1);
        setToast(type === 'departure' ? 'Salida confirmada para los participantes del viaje.' : 'Llegada segura registrada para los participantes del viaje.');
      } catch (error) {
        setSafetyError(error.message || 'No fue posible registrar el check-in.');
      } finally {
        setSafetyActionLoading('');
      }
    }

  const calculateTravelCost = () => {
      if (!Number.isFinite(routeResult?.distanceKm) || routeResult.distanceKm <= 0) {
        setToast('Calcula una ruta válida antes de estimar el aporte.');
        return;
      }
      const { formatted } = calculateTripCost(routeResult.distanceKm);
      setToast(`Aporte estimado: ${formatted} por trayecto.`);
    }

  return {
    runTripAction,
    submitTripOffer,
    loadMoreTripCards,
    loadMoreMyTrips,
    stopTripLocationSharing,
    startTripLocationSharing,
    recordTripCheckIn,
    calculateTravelCost,
  };

}
