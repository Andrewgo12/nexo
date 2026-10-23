import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrivacySection from './PrivacySection';

describe('PrivacySection', () => {
  it('describes the implemented authentication and privacy limitations accurately', () => {
    render(<PrivacySection />);

    expect(screen.getByText('Sanctum')).toBeTruthy();
    expect(screen.getByText('Consentida')).toBeTruthy();
    expect(screen.getByText(/la ubicación exacta puede compartirse durante un viaje/i)).toBeTruthy();
    expect(screen.getByText(/no tienen un flujo automatizado/i)).toBeTruthy();
    expect(screen.queryByText('JWT activo')).toBeNull();
    expect(screen.queryByText('2.430')).toBeNull();
    expect(screen.queryByText('Cifrados')).toBeNull();
  });
});
