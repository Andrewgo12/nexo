import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useTripEffects from './useTripEffects';
import { getMyTrips, getTravelOffers } from '../services/authApi';

vi.mock('../services/authApi', () => ({
  getAuthToken: vi.fn(() => null),
  getMyTrips: vi.fn(),
  getTravelOffers: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function makeState(overrides = {}) {
  return {
    active: 'trips',
    isEmailVerified: true,
    isLoggedIn: true,
    tripRefreshKey: 0,
    setMyTripData: vi.fn(),
    setMyTripsLoadingMore: vi.fn(),
    setMyTripsPagination: vi.fn(),
    setTripCards: vi.fn(),
    setTripCardsHasMore: vi.fn(),
    setTripCardsLoadingMore: vi.fn(),
    setTripCardsNextCursor: vi.fn(),
    setTripError: vi.fn(),
    setTripLoading: vi.fn(),
    ...overrides,
  };
}

describe('useTripEffects offer pagination', () => {
  it('keeps the initial offers cursor and truncation metadata for the next page action', async () => {
    getTravelOffers.mockResolvedValue({
      data: [{ id: 1 }],
      meta: { truncated: true, next_after_id: 1 },
    });
    getMyTrips.mockResolvedValue({ data: { offers: [], requests: [] } });
    const state = makeState();
    const { unmount } = renderHook(() => useTripEffects(state));

    await waitFor(() => expect(state.setTripCards).toHaveBeenCalledWith([{ id: 1 }]));

    expect(state.setTripCardsHasMore).toHaveBeenCalledWith(true);
    expect(state.setTripCardsNextCursor).toHaveBeenCalledWith(1);
    expect(state.setTripCardsLoadingMore).toHaveBeenCalledWith(false);
    expect(state.setMyTripsPagination).toHaveBeenCalledWith({
      offersHasOlder: false,
      offersBeforeId: null,
      requestsHasOlder: false,
      requestsBeforeId: null,
    });
    unmount();
  });

  it('clears the old pagination cursor when refresh requests fail', async () => {
    getTravelOffers.mockRejectedValue(new Error('Network unavailable'));
    getMyTrips.mockResolvedValue({ data: { offers: [], requests: [] } });
    const state = makeState();
    const { unmount } = renderHook(() => useTripEffects(state));

    await waitFor(() => expect(state.setTripError).toHaveBeenCalledWith('Network unavailable'));

    expect(state.setTripCardsHasMore).toHaveBeenCalledWith(false);
    expect(state.setTripCardsNextCursor).toHaveBeenCalledWith(null);
    unmount();
  });
});
