import { useEffect } from 'react';
import { getAuthToken, getTravelMatches, getTravelOffers } from '../services/authApi';
import { mergeMatchRecommendations } from '../services/travelMatching';

export default function useSearchMatchEffects(state, helpers = {}) {
  const { active, authUser, isEmailVerified, isLoggedIn, matchCursor, setMatchCursor, setMatchError, setMatchLoaded, setMatchLoading, setMatchNextCursor, setMatchProfileAvailable, setMatchResults, setMatchTruncated, searchCursor, setSearchError, setSearchLoaded, setSearchLoading, setSearchNextCursor, setSearchResults, setSearchTruncated } = state;
  const { searchFilters } = helpers;

  useEffect(() => {
      if (active !== 'search' || !isLoggedIn || !isEmailVerified) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const cursor = searchCursor;
      const timeoutId = setTimeout(async () => {
        setSearchLoading(true);
        setSearchError('');
        if (!cursor) setSearchLoaded(false);
        try {
          const response = await getTravelOffers(
            { ...searchFilters, after_id: cursor },
            getAuthToken(),
            controller.signal,
          );
          if (!Array.isArray(response.data)) {
            throw new Error('El servidor devolvió una lista de ofertas inválida.');
          }
          if (!cancelled) {
            setSearchResults((current) => cursor ? [...current, ...response.data] : response.data);
            setSearchLoaded(true);
            setSearchTruncated(Boolean(response.meta?.truncated));
            setSearchNextCursor(response.meta?.next_after_id ?? null);
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            if (!cursor) {
              setSearchResults([]);
              setSearchTruncated(false);
              setSearchNextCursor(null);
            }
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
    }, [active, authUser?.id, isEmailVerified, isLoggedIn, searchCursor, searchFilters, setSearchLoaded, setSearchError, setSearchLoading, setSearchNextCursor, setSearchResults, setSearchTruncated]);

  useEffect(() => {
      if (active !== 'match' || !isLoggedIn || !isEmailVerified) return undefined;

      const controller = new AbortController();
      let cancelled = false;
      const cursor = matchCursor;
      const timeoutId = setTimeout(async () => {
        setMatchLoading(true);
        setMatchError('');
        if (!cursor) setMatchLoaded(false);
        try {
          const response = await getTravelMatches(getAuthToken(), controller.signal, cursor);
          if (!Array.isArray(response.data)) {
            throw new Error('El servidor devolvió una lista de coincidencias inválida.');
          }
          if (!cancelled) {
            setMatchResults((current) => cursor
              ? mergeMatchRecommendations(current, response.data)
              : mergeMatchRecommendations([], response.data));
            setMatchProfileAvailable(response.meta?.profile_available !== false);
            setMatchTruncated(Boolean(response.meta?.truncated));
            setMatchNextCursor(response.meta?.next_after_id ?? null);
            setMatchLoaded(true);
          }
        } catch (error) {
          if (!cancelled && error.name !== 'AbortError') {
            if (!cursor) {
              setMatchResults([]);
              setMatchTruncated(false);
              setMatchNextCursor(null);
            }
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
    }, [active, authUser?.id, isEmailVerified, isLoggedIn, matchCursor, setMatchLoading, setMatchNextCursor, setMatchResults, setMatchProfileAvailable, setMatchTruncated, setMatchLoaded, setMatchError]);

  useEffect(() => {
    setMatchCursor(null);
    setMatchNextCursor(null);
    setMatchResults([]);
    setMatchLoaded(false);
  }, [authUser?.id, setMatchCursor, setMatchNextCursor, setMatchResults, setMatchLoaded]);
}
