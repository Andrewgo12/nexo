import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AdvancedSection from './AdvancedSection';

describe('AdvancedSection', () => {
  it('shows advanced capabilities as unavailable instead of exposing nonfunctional toggles or fake counts', () => {
    render(<AdvancedSection />);

    expect(screen.getByText('No disponibles')).toBeTruthy();
    expect(screen.getByText('Sin datos verificados')).toBeTruthy();
    expect(screen.getByText('No integrado')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/\b(5|12)\b/)).toBeNull();
  });
});
