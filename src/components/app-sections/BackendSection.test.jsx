import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BackendSection from './BackendSection';

vi.mock('../../services/authApi', () => ({
  getServiceReadiness: vi.fn(),
}));

import { getServiceReadiness } from '../../services/authApi';

describe('BackendSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows backend scope without inventing production health metrics', () => {
    getServiceReadiness.mockReturnValue(new Promise(() => {}));
    render(<BackendSection />);

    expect(screen.getByText('Laravel')).toBeTruthy();
    expect(screen.getByText('PHPUnit')).toBeTruthy();
    expect(screen.getByText('Consultando')).toBeTruthy();
    expect(screen.getByText('No medidos')).toBeTruthy();
    expect(screen.getByText(/no mide uptime histórico/i)).toBeTruthy();
    expect(screen.getByText(/autenticación, perfiles, búsqueda, ofertas, matching y solicitudes/i)).toBeTruthy();
    expect(screen.queryByText('95.4%')).toBeNull();
    expect(screen.queryByText('GTFS sync')).toBeNull();
    expect(screen.queryByText('Backups')).toBeNull();
  });

  it('shows confirmed readiness only after the API and database checks pass', async () => {
    getServiceReadiness.mockResolvedValue({
      status: 'ready',
      checks: { database: 'ok' },
    });
    render(<BackendSection />);

    expect(await screen.findByText('Disponibles')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('surfaces readiness failures instead of showing an optimistic status', async () => {
    getServiceReadiness.mockRejectedValue({
      message: 'La solicitud falló con el estado 503.',
      status: 503,
    });
    render(<BackendSection />);

    expect(await screen.findByText('No disponibles')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('estado 503');
    expect(screen.getByRole('button', { name: 'Reintentar consulta' })).toBeTruthy();
  });

  it('retries a failed check and updates the display when the backend recovers', async () => {
    getServiceReadiness
      .mockRejectedValueOnce(new Error('Servicio temporalmente no disponible.'))
      .mockResolvedValueOnce({ status: 'ready', checks: { database: 'ok' } });
    render(<BackendSection />);

    await screen.findByRole('button', { name: 'Reintentar consulta' });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));

    expect(await screen.findByText('Disponibles')).toBeTruthy();
    expect(getServiceReadiness).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('reports a failed retry and keeps the retry action available', async () => {
    getServiceReadiness
      .mockRejectedValueOnce(new Error('Servicio no disponible.'))
      .mockRejectedValueOnce(new Error('La base de datos sigue sin responder.'));
    render(<BackendSection />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar consulta' }));

    expect((await screen.findByRole('alert')).textContent).toContain('La base de datos sigue sin responder.');
    expect(screen.getByRole('button', { name: 'Reintentar consulta' })).toBeTruthy();
    expect(getServiceReadiness).toHaveBeenCalledTimes(2);
  });

  it('rejects success-shaped responses that do not confirm database readiness', async () => {
    getServiceReadiness.mockResolvedValue({ status: 'ready', checks: {} });
    render(<BackendSection />);

    expect(await screen.findByText('No disponibles')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('estado de disponibilidad inválido');
  });

  it('cancels the readiness request when the section unmounts', () => {
    getServiceReadiness.mockImplementation((signal) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        reject(new DOMException('Request cancelled.', 'AbortError'));
      }, { once: true });
    }));
    const { unmount } = render(<BackendSection />);
    const [signal] = getServiceReadiness.mock.calls[0];

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
