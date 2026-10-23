import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PrivacySection from './PrivacySection';
import { getAccountDataExport } from '../../services/authApi';

vi.mock('../../services/authApi', () => ({
  getAccountDataExport: vi.fn(),
}));

describe('PrivacySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('describes the implemented authentication and privacy limitations accurately', () => {
    render(<PrivacySection />);

    expect(screen.getByText('Sanctum')).toBeTruthy();
    expect(screen.getByText('Consentida')).toBeTruthy();
    expect(screen.getByText(/las alertas SOS propias incluyen sus coordenadas; revisa el archivo antes de compartirlo/i)).toBeTruthy();
    expect(screen.getByText(/la exportación incluye cuenta, actividad propia, categorías\/estados de denuncias, solicitudes de seguro/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Descargar mis datos' })).toBeTruthy();
    expect(screen.queryByText('JWT activo')).toBeNull();
    expect(screen.queryByText('2.430')).toBeNull();
    expect(screen.queryByText('Cifrados')).toBeNull();
  });

  it('surfaces export failures instead of reporting a successful download', async () => {
    getAccountDataExport.mockRejectedValue(new Error('Sesión expirada.'));
    render(<PrivacySection />);

    fireEvent.click(screen.getByRole('button', { name: 'Descargar mis datos' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Sesión expirada.');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('rejects incomplete export payloads without downloading them', async () => {
    getAccountDataExport.mockResolvedValue({ data: { account: {} } });
    render(<PrivacySection />);

    fireEvent.click(screen.getByRole('button', { name: 'Descargar mis datos' }));

    expect((await screen.findByRole('alert')).textContent).toContain('formato de exportación inválido');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('downloads a valid export and reports completion', async () => {
    getAccountDataExport.mockResolvedValue({
      data: {
        format_version: 1,
        account: { email: 'ana@example.edu' },
        student_profile: null,
        travel_offers: [],
        trip_requests: [],
        received_trip_requests: [],
        reviews_written: [],
        reviews_received: [],
        messages_written: [],
        safety_alerts: [],
        trip_safety_events: [],
        safety_notification_deliveries: [],
        reports_written: [],
        insurance_enrollments: [],
        membership_payments: [],
        trip_check_ins: [],
        trip_locations: [],
      },
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:export'),
      revokeObjectURL: vi.fn(),
    });
    vi.useFakeTimers();
    let downloadedFilename = '';
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      downloadedFilename = this.download;
    });
    render(<PrivacySection />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Descargar mis datos' }));
      await Promise.resolve();
    });

    expect(screen.getByRole('status').textContent).toContain('Se descargó la exportación');
    expect(getAccountDataExport).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(downloadedFilename).toMatch(/^viajau-datos-cuenta-\d{4}-\d{2}-\d{2}\.json$/);
    vi.runOnlyPendingTimers();
  });
});
