import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInsuranceProducts, getMyInsuranceEnrollments, getMyMembership, getMyReputation } from '../services/authApi';
import useAccountDataEffects from './useAccountDataEffects';

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
}));

describe('useAccountDataEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        'setChatLoading',
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
        'setChatLoading',
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
});
