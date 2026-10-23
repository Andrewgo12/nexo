import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('self-hosted routing providers', () => {
  it('uses the configured OSRM endpoint and removes trailing slashes', async () => {
    vi.stubEnv('VITE_OSRM_DRIVING_URL', 'http://127.0.0.1:5000///');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{
          distance: 1500,
          duration: 300,
          geometry: { coordinates: [[-76.53, 3.45], [-76.52, 3.46]] },
        }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getOsrmRoute } = await import('./routingApi.js');
    await getOsrmRoute([3.45, -76.53], [3.46, -76.52], 'car');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/route/v1/driving/-76.53,3.45;-76.52,3.46?overview=full&geometries=geojson',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('uses the configured local Nominatim endpoint', async () => {
    vi.stubEnv('VITE_NOMINATIM_URL', 'http://127.0.0.1:8088/');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    const { searchAddressNominatim } = await import('./routingApi.js');
    await searchAddressNominatim('Universidad');

    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /^http:\/\/127\.0\.0\.1:8088\/search\?/,
    );
  });
});
