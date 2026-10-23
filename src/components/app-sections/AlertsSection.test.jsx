import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AlertsSection from './AlertsSection';

describe('AlertsSection', () => {
  it('describes the local departure reminder and clearly identifies disconnected channels', () => {
    render(
      <AlertsSection
        notifications={[]}
        onToggleNotification={vi.fn()}
      />,
    );

    expect(screen.getByText(/notificación local del navegador/i)).toBeTruthy();
    expect(screen.getByText(/solo funciona con ViajaU abierta/i)).toBeTruthy();
    expect(screen.getByText(/no se envían desde estas preferencias/i)).toBeTruthy();
    expect(screen.queryByText('enviarPush()')).toBeNull();
  });
});
