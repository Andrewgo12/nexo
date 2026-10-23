import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInsuranceProducts, getMyInsuranceEnrollments, getMyMembership, getMyReputation, getTripMessages } from '../services/authApi';
import useAccountDataEffects from './useAccountDataEffects';

let originalHiddenDescriptor;

vi.mock('../services/authApi', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
  getMyReputation: vi.fn(() => Promise.resolve({ data: null })),
  getAdminReports: vi.fn(() => Promise.resolve({ data: [] })),
  getMyMembership: vi.fn(() => Promise.resolve({ data: null })),
  getInsuranceProducts: vi.fn(() => Promise.resolve({ data: [] })),
  getMyInsuranceEnrollments: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminInsuranceEnrollments: vi.fn(() => Promise.resolve({ data: [] })),
  getMyTrips: vi.fn(() => Promise.resolve({ data: { offers: [], requests: [] } })),
  getCommunicationTrips: vi.fn(() => Promise.resolve({ data: [] })),
  getTripMessages: vi.fn(() => Promise.resolve({ data: [], meta: {} })),
  sendTripMessage: vi.fn(),
}));

describe('useAccountDataEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalHiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
  });

  afterEach(() => {
    if (originalHiddenDescriptor) {
      Object.defineProperty(document, 'hidden', originalHiddenDescriptor);
    } else {
      delete document.hidden;
    }
    vi.useRealTimers();
  });

  it('reloads account-scoped reputation and payment data when the user changes', async () => {
    const state = {
      active: 'payments',
      adminReportsPage: 1,
      authUser: { id: 1, role: 'student' },
      insuranceRefresh: 0,
      isEmailVerified: true,
      isLoggedIn: true,
      reputationRefresh: 0,
      selectedChatTripId: '',
      tripRefreshKey: 0,
      ...Object.fromEntries([
        'setAdminInsuranceEnrollments',
        'setAdminReports',
        'setAdminReportsMeta',
        'setChatError',
        'setChatHasOlder',
        'setChatLoading',
        'setChatLoadingOlder',
        'setChatMessages',
        'setChatReadOnly',
        'setDashboardConversations',
        'setDashboardError',
        'setDashboardLoading',
        'setDashboardReputation',
        'setDashboardTrips',
        'setInsuranceError',
        'setInsuranceLoading',
        'setInsuranceProducts',
        'setMembershipInfo',
        'setMyInsuranceEnrollments',
        'setReputationData',
        'setReputationError',
        'setReputationLoading',
        'setSelectedChatTripId',
      ].map((setter) => [setter, vi.fn()])),
    };

    const { rerender } = renderHook(
      ({ userId }) => useAccountDataEffects({ ...state, authUser: { id: userId, role: 'student' } }),
      { initialProps: { userId: 1 } },
    );
    await waitFor(() => expect(getInsuranceProducts).toHaveBeenCalledTimes(1));

    rerender({ userId: 2 });

    await waitFor(() => {
      expect(getInsuranceProducts).toHaveBeenCalledTimes(2);
      expect(getMyInsuranceEnrollments).toHaveBeenCalledTimes(2);
      expect(getMyMembership).toHaveBeenCalledTimes(2);
    });
    expect(state.setDashboardTrips).toHaveBeenCalledWith({ offers: [], requests: [] });
    expect(state.setReputationData).toHaveBeenCalledWith(null);
    expect(state.setInsuranceProducts).toHaveBeenCalledWith([]);
  });

  it('reloads reputation data when the authenticated user changes', async () => {
    const state = {
      active: 'trust',
      adminReportsPage: 1,
      authUser: { id: 1, role: 'student' },
      insuranceRefresh: 0,
      isEmailVerified: true,
      isLoggedIn: true,
      reputationRefresh: 0,
      selectedChatTripId: '',
      tripRefreshKey: 0,
      ...Object.fromEntries([
        'setAdminInsuranceEnrollments',
        'setAdminReports',
        'setAdminReportsMeta',
        'setChatError',
        'setChatHasOlder',
        'setChatLoading',
        'setChatLoadingOlder',
        'setChatMessages',
        'setChatReadOnly',
        'setDashboardConversations',
        'setDashboardError',
        'setDashboardLoading',
        'setDashboardReputation',
        'setDashboardTrips',
        'setInsuranceError',
        'setInsuranceLoading',
        'setInsuranceProducts',
        'setMembershipInfo',
        'setMyInsuranceEnrollments',
        'setReputationData',
        'setReputationError',
        'setReputationLoading',
        'setSelectedChatTripId',
      ].map((setter) => [setter, vi.fn()])),
    };

    const { rerender } = renderHook(
      ({ userId }) => useAccountDataEffects({ ...state, authUser: { id: userId, role: 'student' } }),
      { initialProps: { userId: 1 } },
    );
    await waitFor(() => expect(getMyReputation).toHaveBeenCalledTimes(1));

    rerender({ userId: 2 });

    await waitFor(() => expect(getMyReputation).toHaveBeenCalledTimes(2));
  });

  it('pauses chat polling while hidden and refreshes messages when visible again', async () => {
    vi.useFakeTimers();
    const state = {
      active: 'dashboard',
      authUser: { id: 7, role: 'student' },
      isEmailVerified: true,
      isLoggedIn: true,
      selectedChatTripId: '42',
      ...Object.fromEntries([
        'setAdminInsuranceEnrollments',
        'setAdminReports',
        'setAdminReportsMeta',
        'setChatError',
        'setChatHasOlder',
        'setChatLoading',
        'setChatLoadingOlder',
        'setChatMessages',
        'setChatReadOnly',
        'setDashboardConversations',
        'setDashboardError',
        'setDashboardLoading',
        'setDashboardReputation',
        'setDashboardTrips',
        'setInsuranceError',
        'setInsuranceLoading',
        'setInsuranceProducts',
        'setMembershipInfo',
        'setMyInsuranceEnrollments',
        'setReputationData',
        'setReputationError',
        'setReputationLoading',
        'setSelectedChatTripId',
      ].map((setter) => [setter, vi.fn()])),
    };
    const { unmount } = renderHook(() => useAccountDataEffects(state));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getTripMessages).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    await act(async () => {
      vi.advanceTimersByTime(12000);
      await Promise.resolve();
    });
    expect(getTripMessages).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getTripMessages).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => {
      vi.advanceTimersByTime(12000);
    });
    expect(getTripMessages).toHaveBeenCalledTimes(2);
  });

  it('clears the previous conversation before loading a newly selected trip', async () => {
    const state = {
      active: 'dashboard',
      authUser: { id: 7, role: 'student' },
      isEmailVerified: true,
      isLoggedIn: true,
      selectedChatTripId: '42',
      ...Object.fromEntries([
        'setAdminInsuranceEnrollments',
        'setAdminReports',
        'setAdminReportsMeta',
        'setChatError',
        'setChatHasOlder',
        'setChatLoading',
        'setChatLoadingOlder',
        'setChatMessages',
        'setChatReadOnly',
        'setDashboardConversations',
        'setDashboardError',
        'setDashboardLoading',
        'setDashboardReputation',
        'setDashboardTrips',
        'setInsuranceError',
        'setInsuranceLoading',
        'setInsuranceProducts',
        'setMembershipInfo',
        'setMyInsuranceEnrollments',
        'setReputationData',
        'setReputationError',
        'setReputationLoading',
        'setSelectedChatTripId',
      ].map((setter) => [setter, vi.fn()])),
    };
    const { rerender } = renderHook(
      ({ tripId }) => useAccountDataEffects({ ...state, selectedChatTripId: tripId }),
      { initialProps: { tripId: '42' } },
    );
    await waitFor(() => expect(getTripMessages).toHaveBeenCalledTimes(1));

    rerender({ tripId: '99' });

    expect(state.setChatMessages).toHaveBeenLastCalledWith([]);
    expect(state.setChatError).toHaveBeenLastCalledWith('');
    expect(state.setChatReadOnly).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(getTripMessages).toHaveBeenCalledTimes(2));
    expect(getTripMessages.mock.calls[1][0]).toBe('99');
  });

  it('uses the last received message id for subsequent poll requests', async () => {
    vi.useFakeTimers();
    getTripMessages
      .mockResolvedValueOnce({
        data: [{ id: 8, body: 'Initial message', created_at: '2026-10-22T10:00:00Z' }],
        meta: { read_only: false },
      })
      .mockResolvedValue({
        data: [{ id: 12, body: 'New message', created_at: '2026-10-22T10:01:00Z' }],
        meta: { read_only: false },
      });
    const state = {
      active: 'dashboard',
      authUser: { id: 7, role: 'student' },
      isEmailVerified: true,
      isLoggedIn: true,
      selectedChatTripId: '42',
      ...Object.fromEntries([
        'setAdminInsuranceEnrollments',
        'setAdminReports',
        'setAdminReportsMeta',
        'setChatError',
        'setChatHasOlder',
        'setChatLoading',
        'setChatLoadingOlder',
        'setChatMessages',
        'setChatReadOnly',
        'setDashboardConversations',
        'setDashboardError',
        'setDashboardLoading',
        'setDashboardReputation',
        'setDashboardTrips',
        'setInsuranceError',
        'setInsuranceLoading',
        'setInsuranceProducts',
        'setMembershipInfo',
        'setMyInsuranceEnrollments',
        'setReputationData',
        'setReputationError',
        'setReputationLoading',
        'setSelectedChatTripId',
      ].map((setter) => [setter, vi.fn()])),
    };
    const { unmount } = renderHook(() => useAccountDataEffects(state));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getTripMessages.mock.calls[0][3]).toEqual({});

    await act(async () => {
      vi.advanceTimersByTime(12000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getTripMessages.mock.calls[1][3]).toEqual({ sinceId: 8 });
    expect(state.setChatMessages).toHaveBeenCalled();
    unmount();
  });

  it('uses the zero cursor after an empty initial history response', async () => {
    vi.useFakeTimers();
    getTripMessages
      .mockResolvedValueOnce({ data: [], meta: { has_older: false } })
      .mockResolvedValue({ data: [], meta: { has_older: false } });
    const state = {
      active: 'dashboard',
      authUser: { id: 7, role: 'student' },
      isEmailVerified: true,
      isLoggedIn: true,
      selectedChatTripId: '42',
      ...Object.fromEntries([
        'setAdminInsuranceEnrollments',
        'setAdminReports',
        'setAdminReportsMeta',
        'setChatError',
        'setChatHasOlder',
        'setChatLoading',
        'setChatLoadingOlder',
        'setChatMessages',
        'setChatReadOnly',
        'setDashboardConversations',
        'setDashboardError',
        'setDashboardLoading',
        'setDashboardReputation',
        'setDashboardTrips',
        'setInsuranceError',
        'setInsuranceLoading',
        'setInsuranceProducts',
        'setMembershipInfo',
        'setMyInsuranceEnrollments',
        'setReputationData',
        'setReputationError',
        'setReputationLoading',
        'setSelectedChatTripId',
      ].map((setter) => [setter, vi.fn()])),
    };
    const { unmount } = renderHook(() => useAccountDataEffects(state));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(12000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getTripMessages).toHaveBeenCalledTimes(2);
    expect(getTripMessages.mock.calls[1][3]).toEqual({ sinceId: 0 });
    unmount();
  });
});
