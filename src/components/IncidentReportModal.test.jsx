import { fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IncidentReportModal from './IncidentReportModal';

const defaultProps = {
  isOpen: false,
  onClose: vi.fn(),
  onAddIncident: vi.fn(),
  activeUniversity: { shortName: 'UNIAJC', coords: [3.45, -76.53] },
  studentUser: { name: 'Ana Example' },
};

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('IncidentReportModal', () => {
  it('can transition from closed to open without changing the hook order', () => {
    const { rerender } = render(<IncidentReportModal {...defaultProps} />);

    expect(screen.queryByRole('button', { name: /Publicar Alerta/ })).toBeNull();
    rerender(<IncidentReportModal {...defaultProps} isOpen />);
    expect(screen.getByRole('button', { name: /Publicar Alerta/ })).toBeTruthy();
  });

  it('does not publish a delayed submission after the modal is closed', () => {
    vi.useFakeTimers();
    const { rerender } = render(<IncidentReportModal {...defaultProps} isOpen />);
    fireEvent.change(screen.getByPlaceholderText('Ej: Falla de luminaria en sendero Cañasgordas'), {
      target: { value: 'Luminaria apagada' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Publicar Alerta/ }));

    rerender(<IncidentReportModal {...defaultProps} isOpen={false} />);
    act(() => vi.advanceTimersByTime(1000));

    expect(defaultProps.onAddIncident).not.toHaveBeenCalled();
  });
});
