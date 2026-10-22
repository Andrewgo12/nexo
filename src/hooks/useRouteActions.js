import { getMioRoute } from '../services/mioRoutingApi';
import { getOsrmRoute, searchAddressNominatim } from '../services/routingApi';
import { buildRouteSummary } from '../services/viajauCore';
import { getCurrentDeviceLocation } from '../services/locationApi';

export default function useRouteActions(state) {
  const { route, routeLocations, setDeviceLocation, setLocationLoading, setRoute, setRouteError, setRouteLoading, setRouteLocations, setRouteResult, setRouteSearchLoading, setRouteSearchResults, setSearchCursor, setSearchError, setSearchLoaded, setSearchLoading, setSearchNextCursor, setSearchResults, setSearchState, setToast } = state;

  const updateSearchFilter = (key, value) => {
      setSearchState((current) => ({ ...current, [key]: value }));
      setSearchCursor(null);
      setSearchNextCursor(null);
      setSearchResults([]);
      setSearchLoading(true);
      setSearchError('');
      setSearchLoaded(false);
    }

  const calculateRouteNow = async () => {
      if (!routeLocations.origin || !routeLocations.destination) {
        setRouteError('Busca y selecciona un resultado para el origen y el destino antes de calcular.');
        return;
      }

      const mode = route.mode.toLowerCase().includes('carro') ? 'car'
        : route.mode.toLowerCase().includes('moto') ? 'moto'
          : route.mode.toLowerCase().includes('taxi') ? 'taxi'
            : route.mode.toLowerCase().includes('bici') ? 'bike'
              : route.mode.toLowerCase().includes('caminata') ? 'walk'
              : 'mio';
      setRouteLoading(true);
      setRouteError('');
      try {
        const result = mode === 'mio'
          ? await getMioRoute(routeLocations.origin, routeLocations.destination)
          : await getOsrmRoute(routeLocations.origin, routeLocations.destination, mode);
        const summary = buildRouteSummary({ origin: route.origin, destination: route.destination, mode: route.mode, routeResult: result });
        setRouteResult(result);
        setToast(`Ruta calculada con ${result.source}: ${summary.distance} / ${summary.duration}.`);
      } catch (error) {
        setRouteResult(null);
        setRouteError(error.message || 'No fue posible calcular una ruta real.');
      } finally {
        setRouteLoading(false);
      }
    }

  const searchRouteLocation = async (fieldName) => {
      setRouteSearchLoading(fieldName);
      setRouteError('');
      setRouteSearchResults((current) => ({ ...current, [fieldName]: [] }));
      try {
        const results = await searchAddressNominatim(route[fieldName]);
        setRouteSearchResults((current) => ({ ...current, [fieldName]: results }));
        if (!results.length) setRouteError('No se encontraron lugares. Prueba con otra dirección o un barrio de Cali.');
      } catch (error) {
        setRouteError(error.message || 'No fue posible buscar esa dirección.');
      } finally {
        setRouteSearchLoading('');
      }
    }

  const selectRouteLocation = (fieldName, result) => {
      setRoute((current) => ({ ...current, [fieldName]: result.name }));
      setRouteLocations((current) => ({
        ...current,
        [fieldName]: [result.lat, result.lng],
      }));
      setRouteSearchResults((current) => ({ ...current, [fieldName]: [] }));
      setRouteResult(null);
      setRouteError('');
    }

  const useDeviceLocation = async () => {
      setLocationLoading(true);
      setRouteError('');
      try {
        const location = await getCurrentDeviceLocation();
        const coordinates = [location.lat, location.lng];
        setDeviceLocation(coordinates);
        setRouteLocations((current) => ({ ...current, origin: coordinates }));
        setRoute((current) => ({ ...current, origin: 'Mi ubicación actual' }));
        setRouteSearchResults((current) => ({ ...current, origin: [] }));
        setRouteResult(null);
        setToast(
          location.accuracy
            ? `Ubicación obtenida con precisión aproximada de ${Math.round(location.accuracy)} m. Solo se conserva durante esta sesión.`
            : 'Ubicación obtenida. Solo se conserva durante esta sesión.',
        );
      } catch (error) {
        setRouteError(error.message);
      } finally {
        setLocationLoading(false);
      }
    }

  return {
    updateSearchFilter,
    calculateRouteNow,
    searchRouteLocation,
    selectRouteLocation,
    useDeviceLocation,
  };

}
