import { describe, expect, it } from 'vitest';
import { buildRouteSummary } from './profileCore';

describe('buildRouteSummary', () => {
  it('does not invent distance, duration, or a safety score before a route is calculated', () => {
    expect(buildRouteSummary({
      origin: 'Centro',
      destination: 'Campus',
      mode: 'Carro',
    })).toEqual({
      duration: 'Pendiente',
      distance: 'Pendiente',
      safety: 'No evaluado',
      routeLabel: 'Centro → Campus',
    });
  });

  it('uses provider metrics and keeps safety unassessed when the provider does not assess it', () => {
    expect(buildRouteSummary({
      origin: 'Centro',
      destination: 'Campus',
      routeResult: { distanceKm: 6.25, durationMin: 19, source: 'OSRM' },
    })).toEqual({
      duration: '19 min',
      distance: '6.3 km',
      safety: 'No evaluado',
      routeLabel: 'Centro → Campus',
    });
  });

  it('shows missing route metrics as unavailable instead of fabricating estimates', () => {
    expect(buildRouteSummary({
      routeResult: { distanceKm: null, durationMin: null },
    })).toMatchObject({
      duration: 'Horario no disponible',
      distance: 'Distancia no disponible',
      safety: 'No evaluado',
    });
  });
});
