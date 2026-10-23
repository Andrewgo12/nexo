import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('account data export API', () => {
  it('requests the authenticated export using the existing session credentials', async () => {
    const payload = { data: { format_version: 1, account: { email: 'ana@example.edu' } } };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(payload),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { getAccountDataExport } = await import('./authApi.js');
    await expect(getAccountDataExport()).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/api/account/export', expect.objectContaining({
      credentials: 'include',
      headers: expect.any(Headers),
      signal: expect.any(AbortSignal),
    }));
    expect(fetchMock.mock.calls[0][1].headers.get('Accept')).toBe('application/json');
    expect(fetchMock.mock.calls[0][1].headers.has('Authorization')).toBe(false);
  });

  it('forwards cancellation to the export request', async () => {
    const fetchMock = vi.fn((_, options) => new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => {
        reject(new DOMException('Request cancelled.', 'AbortError'));
      }, { once: true });
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { getAccountDataExport } = await import('./authApi.js');
    const controller = new AbortController();

    const request = getAccountDataExport(undefined, controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('preserves authentication failures so the interface can report them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Sesión expirada.' }),
    }));
    const { getAccountDataExport } = await import('./authApi.js');

    await expect(getAccountDataExport()).rejects.toMatchObject({
      message: 'Sesión expirada.',
      status: 401,
    });
  });

  describe('backend readiness API', () => {
    it('requests the public readiness endpoint with caller cancellation', async () => {
      const payload = { status: 'ready', checks: { database: 'ok' } };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(payload),
      });
      vi.stubGlobal('fetch', fetchMock);

      const { getServiceReadiness } = await import('./authApi.js');
      const controller = new AbortController();
      await expect(getServiceReadiness(controller.signal)).resolves.toEqual(payload);

      expect(fetchMock).toHaveBeenCalledWith('/api/ready', expect.objectContaining({
        credentials: 'include',
        signal: expect.any(AbortSignal),
      }));
    });

    it('preserves unavailable readiness responses for the UI', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => JSON.stringify({
          status: 'not_ready',
          checks: { database: 'unavailable' },
        }),
      }));
      const { getServiceReadiness } = await import('./authApi.js');

      await expect(getServiceReadiness()).rejects.toMatchObject({
        message: 'La solicitud falló con el estado 503.',
        status: 503,
      });
    });
  });
});
