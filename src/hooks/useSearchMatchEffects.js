import { useEffect } from 'react';
import { getAuthToken, getTravelMatches, getTravelOffers } from '../services/authApi';

export default function useSearchMatchEffects(state, helpers = {}) {
  const { active, isEmailVerified, isLoggedIn, setMatchError, setMatchLoaded, setMatchLoading, setMatchProfileAvailable, setMatchResults, setMatchTruncated, setSearchError, setSearchLoaded, setSearchLoading, setSearchResults, setSearchTruncated } = state;
  const { searchFilters } = helpers;

  useEffect(() => {
      if (active !== 'search' || !isLoggedIn || !isEmailVerified) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const timeoutId = setTimeout(async () => {
        setSearchLoading(true);
        setSearchError('');
        setSearchLoaded(false);
        try {
          const response = await getTravelOffers(searchFilters, getAuthToken(), controller.signal);
          if (!Array.isArray(response.data)) {
            throw new Error('El servidor devolvió una lista de ofertas inválida.');
          }
          if (!cancelled) {
            setSearchResults(response.data);
            setSearchLoaded(true);
            setSearchTruncated(Boolean(response.meta?.truncated));
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setSearchResults([]);
            setSearchTruncated(false);
            setSearchError(error.message || 'No fue posible buscar ofertas de viaje.');
          }
        } finally {
          if (!cancelled) setSearchLoading(false);
        }
      }, 300);

      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
        controller.abort();
      };
    }, [active, isEmailVerified, isLoggedIn, searchFilters, setSearchLoaded, setSearchError, setSearchLoading, setSearchResults, setSearchTruncated]);

  useEffect(() => {
      if (active !== 'match' || !isLoggedIn || !isEmailVerified) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const timeoutId = setTimeout(async () => {
        setMatchLoading(true);
        setMatchError('');
        setMatchLoaded(false);
        try {
          const response = await getTravelMatches(getAuthToken(), controller.signal);
          if (!Array.isArray(response.data)) {
            throw new Error('El servidor devolvió una lista de coincidencias inválida.');
          }
          if (!cancelled) {
            setMatchResults(response.data);
            setMatchProfileAvailable(response.meta?.profile_available !== false);
            setMatchTruncated(Boolean(response.meta?.truncated));
            setMatchLoaded(true);
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            setMatchResults([]);
            setMatchTruncated(false);
            setMatchError(error.message || 'No fue posible calcular coincidencias de viaje.');
          }
        } finally {
          if (!cancelled) setMatchLoading(false);
        }
      }, 200);

      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
        controller.abort();
      };
    }, [active, isEmailVerified, isLoggedIn, setMatchLoading, setMatchResults, setMatchProfileAvailable, setMatchTruncated, setMatchLoaded, setMatchError]);
}
