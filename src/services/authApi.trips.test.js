import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('personal trip history API', () => {
  it('requests a page using independent offer and request cursors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { offers: [], requests: [] }, meta: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { getMyTrips } = await import('./authApi.js');

    await getMyTrips(undefined, undefined, { offersBeforeId: 25, requestsBeforeId: 18 });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/trips/mine?offers_before_id=25&requests_before_id=18');
  });

  it('rejects invalid history cursors without sending a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { getMyTrips } = await import('./authApi.js');

    expect(() => getMyTrips(undefined, undefined, { offersBeforeId: 0 })).toThrow(RangeError);
    expect(() => getMyTrips(undefined, undefined, { requestsBeforeId: Number.MAX_SAFE_INTEGER + 1 }))
      .toThrow(RangeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
