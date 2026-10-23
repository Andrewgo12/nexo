import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('trip message polling API', () => {
  it('requests incremental messages after the last received id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [], meta: { read_only: false } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { getTripMessages } = await import('./authApi.js');

    await expect(getTripMessages(42, undefined, undefined, { sinceId: 17 })).resolves.toMatchObject({
      data: [],
      meta: { read_only: false },
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/trips/42/messages?since_id=17', expect.objectContaining({
      credentials: 'include',
      headers: expect.any(Headers),
      signal: expect.any(AbortSignal),
    }));
  });

  it('keeps the existing initial history request when there is no cursor', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [], meta: { read_only: false } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { getTripMessages } = await import('./authApi.js');

    await getTripMessages(42);

    expect(fetchMock.mock.calls[0][0]).toBe('/api/trips/42/messages');
  });

  it('requests older messages with the before id cursor', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [], meta: { has_older: false } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { getTripMessages } = await import('./authApi.js');

    await getTripMessages(42, undefined, undefined, { beforeId: 9 });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/trips/42/messages?before_id=9');
  });

  it('rejects ambiguous or invalid cursors before making a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { getTripMessages } = await import('./authApi.js');

    expect(() => getTripMessages(42, undefined, undefined, { sinceId: 1, beforeId: 2 }))
      .toThrow('no puede incluir sinceId y beforeId');
    expect(() => getTripMessages(42, undefined, undefined, { beforeId: 0 }))
      .toThrow('beforeId debe ser un entero seguro');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
