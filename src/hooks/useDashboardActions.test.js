import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTripMessages, sendTripMessage } from '../services/authApi';
import useDashboardActions from './useDashboardActions';

vi.mock('../services/authApi', () => ({
  getAuthToken: vi.fn(() => null),
  getTripMessages: vi.fn(),
  sendTripMessage: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function makeState(overrides = {}) {
  return {
    chatDraft: 'Meet at the main entrance',
    selectedChatTripId: '42',
    setChatAction: vi.fn(),
    setChatDraft: vi.fn(),
    setChatError: vi.fn(),
    setChatMessages: vi.fn(),
    setSelectedChatTripId: vi.fn(),
    chatMessages: [{ id: 10, body: 'Latest', created_at: '2026-10-22T10:10:00Z' }],
    chatHasOlder: true,
    chatLoadingOlder: false,
    setChatHasOlder: vi.fn(),
    setChatLoadingOlder: vi.fn(),
    ...overrides,
  };
}

describe('useDashboardActions', () => {
  it('submits once, validates the server response, and clears the draft on success', async () => {
    sendTripMessage.mockResolvedValue({
      data: { id: 8, body: 'Meet at the main entrance', created_at: '2026-10-22T10:00:00Z' },
    });
    const state = makeState();
    const { result } = renderHook(() => useDashboardActions(state));
    const event = { preventDefault: vi.fn() };

    await act(async () => {
      await result.current.submitDashboardMessage(event);
    });

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(sendTripMessage).toHaveBeenCalledWith(42, 'Meet at the main entrance');
    expect(state.setChatMessages).toHaveBeenCalledWith(expect.any(Function));
    expect(state.setChatDraft).toHaveBeenCalledWith('');
    expect(state.setChatAction).toHaveBeenNthCalledWith(1, true);
    expect(state.setChatAction).toHaveBeenLastCalledWith(false);
  });

  it('does not append a late response to another selected conversation', async () => {
    let resolveMessage;
    sendTripMessage.mockReturnValue(new Promise((resolve) => {
      resolveMessage = resolve;
    }));
    const state = makeState();
    const { result, rerender } = renderHook(
      ({ tripId }) => useDashboardActions({ ...state, selectedChatTripId: tripId }),
      { initialProps: { tripId: '42' } },
    );
    const request = result.current.submitDashboardMessage({ preventDefault: vi.fn() });

    rerender({ tripId: '99' });
    await act(async () => {
      resolveMessage({
        data: { id: 8, body: 'Meet at the main entrance', created_at: '2026-10-22T10:00:00Z' },
      });
      await request;
    });

    expect(state.setChatMessages).not.toHaveBeenCalled();
    expect(state.setChatDraft).not.toHaveBeenCalled();
    expect(state.setChatError).toHaveBeenCalledWith('');
  });

  it('prevents duplicate sends while a request is in flight', async () => {
    let resolveMessage;
    sendTripMessage.mockReturnValue(new Promise((resolve) => {
      resolveMessage = resolve;
    }));
    const state = makeState();
    const { result } = renderHook(() => useDashboardActions(state));
    const event = { preventDefault: vi.fn() };

    let firstRequest;
    await act(async () => {
      firstRequest = result.current.submitDashboardMessage(event);
      await Promise.resolve();
      await result.current.submitDashboardMessage(event);
    });
    expect(sendTripMessage).toHaveBeenCalledOnce();

    await act(async () => {
      resolveMessage({
        data: { id: 8, body: 'Meet at the main entrance', created_at: '2026-10-22T10:00:00Z' },
      });
      await firstRequest;
    });
  });

  it('loads and prepends older messages and updates the older-page state', async () => {
    getTripMessages.mockResolvedValue({
      data: [{ id: 5, body: 'Older', created_at: '2026-10-22T10:05:00Z' }],
      meta: { has_older: true },
    });
    const state = makeState();
    const { result } = renderHook(() => useDashboardActions(state));

    await act(async () => {
      await result.current.loadOlderChatMessages();
    });

    expect(getTripMessages).toHaveBeenCalledWith('42', null, undefined, { beforeId: 10 });
    expect(state.setChatMessages).toHaveBeenCalledWith(expect.any(Function));
    expect(state.setChatHasOlder).toHaveBeenCalledWith(true);
    expect(state.setChatLoadingOlder).toHaveBeenNthCalledWith(1, true);
    expect(state.setChatLoadingOlder).toHaveBeenLastCalledWith(false);
  });

  it('stops offering older pages when the in-memory history reaches its limit', async () => {
    getTripMessages.mockResolvedValue({
      data: [{ id: 101, body: 'Oldest loaded page', created_at: '2026-10-22T10:00:00Z' }],
      meta: { has_older: true },
    });
    const chatMessages = Array.from({ length: 499 }, (_, index) => ({
      id: index + 102,
      body: `Message ${index + 102}`,
      created_at: new Date(Date.UTC(2026, 9, 22, 10, index + 1)).toISOString(),
    }));
    const state = makeState({ chatMessages });
    const { result } = renderHook(() => useDashboardActions(state));

    await act(async () => {
      await result.current.loadOlderChatMessages();
    });

    expect(state.setChatMessages).toHaveBeenCalledWith(expect.any(Function));
    expect(state.setChatHasOlder).toHaveBeenCalledWith(false);
  });

  it('reports older-history fetch errors without clearing the current messages', async () => {
    getTripMessages.mockRejectedValue(new Error('Network unavailable'));
    const state = makeState();
    const { result } = renderHook(() => useDashboardActions(state));

    await act(async () => {
      await result.current.loadOlderChatMessages();
    });

    expect(state.setChatError).toHaveBeenCalledWith('Network unavailable');
    expect(state.setChatMessages).not.toHaveBeenCalled();
  });
});
