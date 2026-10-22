import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentAccount } from '../services/authApi';
import { writeAppData } from '../services/appDatabase';
import useSessionEffects from './useSessionEffects';

vi.mock('../services/authApi', () => ({
  clearAuthToken: vi.fn(),
  getCurrentAccount: vi.fn(),
}));

vi.mock('../services/appDatabase', () => ({
  writeAppData: vi.fn(),
}));

describe('useSessionEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentAccount.mockRejectedValue({ status: 401 });
    writeAppData.mockImplementation(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('surfaces local preference persistence failures to the user', () => {
    const setToast = vi.fn();

    renderHook(() => useSessionEffects({
      active: 'auth',
      advancedMode: {},
      executionState: [],
      notifications: [],
      setIsBooting: vi.fn(),
      setIsLoggedIn: vi.fn(),
      setToast,
    }, { applyAuthenticatedUser: vi.fn() }));

    expect(setToast).toHaveBeenCalledWith(
      expect.stringContaining('No se pudieron guardar tus preferencias'),
    );
  });
});
