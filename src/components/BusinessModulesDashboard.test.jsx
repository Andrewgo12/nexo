import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BusinessModulesDashboard from './BusinessModulesDashboard';

describe('BusinessModulesDashboard', () => {
  it('presents module descriptions and declared statuses without claiming implementation coverage', () => {
    render(<BusinessModulesDashboard />);

    expect(screen.getByRole('heading', { name: 'Mapa de módulos de ViajaU' })).toBeTruthy();
    expect(screen.getByText('16 módulos descritos')).toBeTruthy();
    expect(screen.getByText(/los nombres de funciones no son una medición de implementación/i)).toBeTruthy();
    expect(screen.getAllByText('Capacidades descritas, no inventario de funciones verificadas')).toHaveLength(16);
    expect(screen.getAllByText(/Estado del módulo:/)).toHaveLength(16);
    expect(screen.queryByText(/Cobertura completa de ViajaU|funciones cubiertas/)).toBeNull();
  }, 15000);
});
