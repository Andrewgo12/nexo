import { describe, expect, it } from 'vitest';
import { calculateTripCost } from './tripOperations';

describe('calculateTripCost', () => {
  it('estimates an indicative contribution from a positive calculated distance', () => {
    expect(calculateTripCost(10)).toEqual({
      totalCop: 5300,
      formatted: '5.300 COP',
    });
  });

  it.each([undefined, null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid route distance %s',
    (distanceKm) => {
      expect(() => calculateTripCost(distanceKm)).toThrow('Calcula una ruta válida');
    },
  );
});
