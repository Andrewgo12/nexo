import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useTripActions from './useTripActions';
import { getMyTrips, getTravelOffers } from '../services/authApi';

vi.mock('../services/authApi', () => ({
  createTripCheckIn: vi.fn(),
  getAuthToken: vi.fn(() => null),
  getMyTrips: vi.fn(),
  getTravelOffers: vi.fn(),
  publishTravelOffer: vi.fn(),
  shareTripLocation: vi.fn(),
  stopSharingTripLocation: vi.fn(),
}));

vi.mock('../services/locationApi', () => ({
  getCurrentDeviceLocation: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function makeState(overrides = {}) {
  return {
    active: 'trips',
    routeResult: null,
    selectedSafetyTripId: '',
    setSafetyActionLoading: vi.fn(),
    setSafetyError: vi.fn(),
    setSafetyRefreshKey: vi.fn(),
    setSharingTripLocation: vi.fn(),
    setToast: vi.fn(),
    setTripActionLoading: vi.fn(),
    setTripCards: vi.fn(),
    setTripCardsHasMore: vi.fn(),
    setTripCardsLoadingMore: vi.fn(),
    setTripCardsNextCursor: vi.fn(),
    setTripError: vi.fn(),
    setTripRefreshKey: vi.fn(),
    myTripData: { offers: [], requests: [{ id: 9 }] },
    myTripsLoadingMore: { offers: false, requests: false },
    myTripsPagination: {
      offersHasOlder: true,
      offersBeforeId: 25,
      requestsHasOlder: true,
      requestsBeforeId: 18,
    },
    setMyTripData: vi.fn(),
    setMyTripsLoadingMore: vi.fn(),
    setMyTripsPagination: vi.fn(),
    tripCards: [{ id: 1 }, { id: 2 }],
    tripCardsHasMore: true,
    tripCardsLoadingMore: false,
    tripCardsNextCursor: 2,
    tripLocationUpdateRef: { current: Promise.resolve() },
    tripOfferForm: {},
    ...overrides,
  };
}

describe('useTripActions offer pagination', () => {
  it('loads a previous owned-offer page without changing the request list', async () => {
    getMyTrips.mockResolvedValue({
      data: { offers: [{ id: 24 }], requests: [] },
      meta: { offers_has_older: false, offers_before_id: null },
    });
    const state = makeState();
    state.myTripData.offers = [{ id: 25 }, { id: 26 }];
    const { result } = renderHook(() => useTripActions(state));

    await act(async () => {
      await result.current.loadMoreMyTrips('offers');
    });

    expect(getMyTrips).toHaveBeenCalledWith(null, undefined, { offersBeforeId: 25 });
    const updateData = state.setMyTripData.mock.calls[0][0];
    expect(updateData(state.myTripData)).toEqual({
      offers: [{ id: 26 }, { id: 25 }, { id: 24 }],
      requests: [{ id: 9 }],
    });
    expect(state.setMyTripsPagination).toHaveBeenCalledWith(expect.any(Function));
    expect(state.setMyTripsLoadingMore).toHaveBeenNthCalledWith(1, expect.any(Function));
  });

  it('keeps history and cursor when fetching an older page fails', async () => {
    getMyTrips.mockRejectedValue(new Error('History unavailable'));
    const state = makeState();
    const { result } = renderHook(() => useTripActions(state));

    await act(async () => {
      await result.current.loadMoreMyTrips('requests');
    });

    expect(getMyTrips).toHaveBeenCalledWith(null, undefined, { requestsBeforeId: 18 });
    expect(state.setTripError).toHaveBeenCalledWith('History unavailable');
    expect(state.setMyTripData).not.toHaveBeenCalled();
    expect(state.setMyTripsPagination).not.toHaveBeenCalled();
  });

  it('rejects unsupported personal-history collections', async () => {
    const { result } = renderHook(() => useTripActions(makeState()));

    await expect(result.current.loadMoreMyTrips('unknown')).rejects.toThrow(RangeError);
  });

  it('does not estimate a contribution until a real route distance is available', () => {
    const state = makeState();
    const { result } = renderHook(() => useTripActions(state));

    act(() => result.current.calculateTravelCost());

    expect(state.setToast).toHaveBeenCalledWith('Calcula una ruta válida antes de estimar el aporte.');
  });

  it('estimates the contribution from the calculated route distance', () => {
    const state = makeState({ routeResult: { distanceKm: 10 } });
    const { result } = renderHook(() => useTripActions(state));

    act(() => result.current.calculateTravelCost());

    expect(state.setToast).toHaveBeenCalledWith('Aporte estimado: 5.300 COP por trayecto.');
  });

  it('loads the next stable cursor page, deduplicates results, and updates pagination state', async () => {
    getTravelOffers.mockResolvedValue({
      data: [{ id: 2 }, { id: 3 }],
      meta: { truncated: true, next_after_id: 3 },
    });
    const state = makeState();
    const { result } = renderHook(() => useTripActions(state));

    await act(async () => {
      await result.current.loadMoreTripCards();
    });

    expect(getTravelOffers).toHaveBeenCalledWith({ after_id: 2 });
    expect(state.setTripCards).toHaveBeenCalledWith(expect.any(Function));
    const updateCards = state.setTripCards.mock.calls[0][0];
    expect(updateCards(state.tripCards)).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(state.setTripCardsNextCursor).toHaveBeenCalledWith(3);
    expect(state.setTripCardsHasMore).toHaveBeenCalledWith(true);
    expect(state.setTripCardsLoadingMore).toHaveBeenNthCalledWith(1, true);
    expect(state.setTripCardsLoadingMore).toHaveBeenLastCalledWith(false);
  });

  it('stops pagination when the API reports the final page', async () => {
    getTravelOffers.mockResolvedValue({
      data: [{ id: 3 }],
      meta: { truncated: false, next_after_id: null },
    });
    const state = makeState();
    const { result } = renderHook(() => useTripActions(state));

    await act(async () => {
      await result.current.loadMoreTripCards();
    });

    expect(state.setTripCardsHasMore).toHaveBeenCalledWith(false);
    expect(state.setTripCardsNextCursor).toHaveBeenCalledWith(null);
  });

  it('keeps existing cards and reports an error when a later page fails', async () => {
    getTravelOffers.mockRejectedValue(new Error('Network unavailable'));
    const state = makeState();
    const { result } = renderHook(() => useTripActions(state));

    await act(async () => {
      await result.current.loadMoreTripCards();
    });

    expect(state.setTripError).toHaveBeenCalledWith('Network unavailable');
    expect(state.setTripCards).not.toHaveBeenCalled();
    expect(state.setTripCardsHasMore).not.toHaveBeenCalled();
  });

  it('rejects a broken next-page cursor without changing loaded cards', async () => {
    getTravelOffers.mockResolvedValue({
      data: [{ id: 3 }],
      meta: { truncated: true, next_after_id: 2 },
    });
    const state = makeState();
    const { result } = renderHook(() => useTripActions(state));

    await act(async () => {
      await result.current.loadMoreTripCards();
    });

    expect(state.setTripError).toHaveBeenCalledWith(
      'El servidor devolvió un cursor inválido para la siguiente página de ofertas.',
    );
    expect(state.setTripCards).not.toHaveBeenCalled();
  });

  it('prevents duplicate requests while a page is in flight', async () => {
    let resolvePage;
    getTravelOffers.mockReturnValue(new Promise((resolve) => {
      resolvePage = resolve;
    }));
    const state = makeState();
    const { result } = renderHook(() => useTripActions(state));

    let firstRequest;
    await act(async () => {
      firstRequest = result.current.loadMoreTripCards();
      await result.current.loadMoreTripCards();
    });
    expect(getTravelOffers).toHaveBeenCalledOnce();

    await act(async () => {
      resolvePage({ data: [{ id: 3 }], meta: { truncated: false } });
      await firstRequest;
    });
  });
});
