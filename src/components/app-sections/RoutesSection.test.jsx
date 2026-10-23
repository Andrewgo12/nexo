import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RoutesSection from './RoutesSection';

function renderRoutesSection(overrides = {}) {
  return render(
    <RoutesSection
      route={{ origin: '', destination: '', mode: 'Carro', time: '' }}
      routeLocations={{ origin: null, destination: null }}
      routeSearchResults={{ origin: [], destination: [] }}
      routeSearchLoading=""
      routeLoading={false}
      routeError=""
      routeResult={null}
      deviceLocation={null}
      locationLoading={false}
      summary={{ duration: 'Pendiente', distance: 'Pendiente' }}
      field={{}}
      onChangeLocation={vi.fn()}
      onSearchLocation={vi.fn()}
      onUseDeviceLocation={vi.fn()}
      onSelectLocation={vi.fn()}
      onChangeMode={vi.fn()}
      onChangeTime={vi.fn()}
      onCalculateRoute={vi.fn()}
      {...overrides}
    />,
  );
}

describe('RoutesSection', () => {
  it('describes routing limits without presenting a completion checklist or safety rating', () => {
    renderRoutesSection();

    expect(screen.getByText('Capacidades y límites de las rutas')).toBeTruthy();
    expect(screen.getByText(/moto usa una ruta genérica de carro/i)).toBeTruthy();
    expect(screen.getByText('No hay una ruta calculada en esta vista.')).toBeTruthy();
    expect(screen.queryByText(/Checklist del módulo 2|completados/)).toBeNull();
  });
});
