import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ArrivalCheckinModal from './ArrivalCheckinModal';

const defaultProps = {
  isOpen: false,
  onClose: vi.fn(),
  onConfirmArrival: vi.fn(),
  onTriggerSOS: vi.fn(),
  studentUser: {
    name: 'Ana Example',
    emergencyContact: { name: 'Contacto', phone: '+573001234567' },
  },
  trip: { destination: { coords: [3.45, -76.53] } },
};

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('ArrivalCheckinModal', () => {
  it('can transition from closed to open without changing the hook order', () => {
    const { rerender } = render(<ArrivalCheckinModal {...defaultProps} />);

    expect(screen.queryByRole('heading', { name: 'Check-in de Llegada Segura' })).toBeNull();
    rerender(<ArrivalCheckinModal {...defaultProps} isOpen />);
    expect(screen.getByRole('heading', { name: 'Check-in de Llegada Segura' })).toBeTruthy();
  });

  it('triggers the SOS callback once when the countdown expires', () => {
    vi.useFakeTimers();
    render(<ArrivalCheckinModal {...defaultProps} isOpen />);

    act(() => vi.advanceTimersByTime(35 * 60 * 1000));

    expect(defaultProps.onTriggerSOS).toHaveBeenCalledTimes(1);
    expect(defaultProps.onTriggerSOS).toHaveBeenCalledWith(expect.objectContaining({
      user: 'Ana Example',
      coords: [3.45, -76.53],
    }));
  });
});
