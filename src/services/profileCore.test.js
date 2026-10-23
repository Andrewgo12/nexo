import { describe, expect, it } from 'vitest';
import {
  buildRouteSummary,
  calculateDistanceBetweenPoints,
  validateInstitutionalEmail,
} from './profileCore';

describe('validateInstitutionalEmail', () => {
  it.each([
    ['Student@uniajc.edu.co', '@uniajc.edu.co', true],
    [' student@UNIAJC.EDU.CO ', 'uniajc.edu.co', true],
    ['student@mail.uniajc.edu.co', '@uniajc.edu.co', false],
    ['student@uniajc.edu.co.attacker.test', '@uniajc.edu.co', false],
    ['student@attackeruniajc.edu.co', '@uniajc.edu.co', false],
    ['student@@uniajc.edu.co', '@uniajc.edu.co', false],
    ['student @uniajc.edu.co', '@uniajc.edu.co', false],
    ['@uniajc.edu.co', '@uniajc.edu.co', false],
    ['student@uniajc.edu.co', '', false],
    ['', '@uniajc.edu.co', false],
  ])('validates %s against the exact institutional domain', (email, domain, expected) => {
    expect(validateInstitutionalEmail(email, domain)).toBe(expected);
  });
});

describe('calculateDistanceBetweenPoints', () => {
  it('calculates distance from the provided coordinates', () => {
    expect(calculateDistanceBetweenPoints(
      { lat: 3.45, lng: -76.5 },
      { lat: 3.52, lng: -76.53 },
    )).toBeCloseTo(8.3, 0);
  });

  it.each([
    [undefined, { lat: 3, lng: -76 }],
    [null, { lat: 3, lng: -76 }],
    [{ lat: null, lng: -76 }, { lat: 3, lng: -76 }],
    [{ lat: 91, lng: -76 }, { lat: 3, lng: -76 }],
    [{ lat: 3, lng: -181 }, { lat: 3, lng: -76 }],
    [{ lat: Number.NaN, lng: -76 }, { lat: 3, lng: -76 }],
  ])('rejects missing or out-of-range coordinates', (origin, destination) => {
    expect(() => calculateDistanceBetweenPoints(origin, destination))
      .toThrow('Se requieren coordenadas geográficas válidas');
  });
});

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
