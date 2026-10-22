import { createTripCheckIn, publishTravelOffer, shareTripLocation, stopSharingTripLocation } from '../services/authApi';
import { getCurrentDeviceLocation } from '../services/locationApi';
import { calculateTripCost } from '../services/viajauCore';

export default function useTripActions(state) {
  const { active, routeResult, selectedSafetyTripId, setSafetyActionLoading, setSafetyError, setSafetyRefreshKey, setSharingTripLocation, setToast, setTripActionLoading, setTripError, setTripRefreshKey, tripLocationUpdateRef, tripOfferForm } = state;

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
      const { premium } = calculateTripCost(routeResult?.distanceKm ?? 8.4);
      setToast(`Costo estimado actualizado: ${premium} por trayecto.`);
    }

  return {
    runTripAction,
    submitTripOffer,
    stopTripLocationSharing,
    startTripLocationSharing,
    recordTripCheckIn,
    calculateTravelCost,
  };

}
