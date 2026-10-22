import { getOsrmRoute, searchAddressNominatim } from '../services/routingApi';
import { getMioRoute } from '../services/mioRoutingApi';
import { createTripCheckIn, publishTravelOffer, shareTripLocation, stopSharingTripLocation } from '../services/authApi';
import { getCurrentDeviceLocation } from '../services/locationApi';
import { calculateTripCost } from '../services/viajauCore';

export default function useTripActions(state, helpers = {}) {
  const { active, routeResult, selectedSafetyTripId, setSafetyActionLoading, setSafetyError, setSafetyRefreshKey, setSharingTripLocation, setToast, setTripActionLoading, setTripError, setTripGeofencePreview, setTripRefreshKey, tripGeofenceConsent, tripGeofencePreview, tripLocationUpdateRef, tripOfferForm } = state;
  const { geofenceRouteFingerprint, hasCurrentGeofencePreview } = helpers;

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
        let safetyRoute = {};
        if (tripGeofenceConsent) {
          if (!hasCurrentGeofencePreview) {
            const [origins, destinations] = await Promise.all([
              searchAddressNominatim(tripOfferForm.origin),
              searchAddressNominatim(tripOfferForm.destination),
            ]);
            if (!origins.length || !destinations.length) {
              throw new Error('No se pudo ubicar el origen o destino para configurar la geocerca.');
            }
            const origin = [origins[0].lat, origins[0].lng];
            const destination = [destinations[0].lat, destinations[0].lng];
            const mode = tripOfferForm.mode.toLocaleLowerCase();
            const routeMode = mode.includes('mio')
              ? 'mio'
              : mode.includes('bici')
                ? 'bike'
                : mode.includes('caminata') || mode.includes('pie')
                  ? 'walk'
                  : mode.includes('moto')
                    ? 'moto'
                    : 'car';
            const route = routeMode === 'mio'
              ? await getMioRoute(origin, destination)
              : await getOsrmRoute(origin, destination, routeMode);
            if (!Array.isArray(route.polyline) || route.polyline.length < 2) {
              throw new Error('El proveedor no devolvió un trazado válido para la geocerca.');
            }
            const polyline = route.polyline.length <= 500
              ? route.polyline
              : Array.from({ length: 500 }, (_, index) => (
                route.polyline[Math.round(index * (route.polyline.length - 1) / 499)]
              ));
            setTripGeofencePreview({
              fingerprint: geofenceRouteFingerprint,
              origin: origins[0].fullName,
              destination: destinations[0].fullName,
              source: route.source,
              polyline,
            });
            setToast('Revisa los resultados geocodificados y confirma la ruta antes de publicar.');
            return;
          }
          safetyRoute = {
            safety_route: tripGeofencePreview.polyline,
            safety_route_duration_minutes: Number(tripOfferForm.safety_route_duration_minutes),
          };
        }
        const { safety_route_duration_minutes: _duration, ...offerFields } = tripOfferForm;
        await publishTravelOffer({
          ...offerFields,
          seats: Number(tripOfferForm.seats),
          ...(tripGeofenceConsent ? safetyRoute : {}),
        });
        setTripRefreshKey((current) => current + 1);
        setToast(tripGeofenceConsent
          ? 'Oferta publicada con geocerca; el trazado se usa para alertas y se elimina al cerrar el viaje. Solo se comparte el evento, no las coordenadas.'
          : 'Oferta de viaje publicada.');
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
