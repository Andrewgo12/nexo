import { describe, expect, it } from 'vitest';
import {
  buildMatchRecommendations,
  calculateCompatibilityScore,
  calculateTravelAffinityScore,
  filterTravelMatches,
  mergeMatchRecommendations,
} from './travelMatching';

describe('travel matching', () => {
  it('scores affinity from matching zone, transport, and shift', () => {
    expect(calculateTravelAffinityScore(
      { neighborhood: 'El Caney', transport: 'MIO + caminata', shift: 'Nocturna' },
      { zone: 'El Caney UNIAJC', time: '19:45', transport: 'MIO + caminata' },
    )).toBe(100);
    expect(calculateTravelAffinityScore(
      { neighborhood: 'Pance', transport: 'Carro', shift: 'Diurna' },
      { zone: 'El Caney UNIAJC', time: '19:45', transport: 'MIO' },
    )).toBe(0);
  });

  it('filters offers by zone, hour, career, university, and transport', () => {
    const offers = [
      {
        id: 1,
        zone: 'El Caney UNIAJC',
        time: '19:45',
        faculty: 'Ingeniería de Sistemas',
        university: 'UNIAJC',
        transport: 'MIO + caminata',
      },
      {
        id: 2,
        zone: 'Pance',
        time: '20:15',
        faculty: 'Diseño',
        university: 'Icesi',
        transport: 'Carro',
      },
    ];

    expect(filterTravelMatches({
      zone: 'caney',
      time: '19:10',
      faculty: 'sistemas',
      university: 'UNIAJC',
      transport: 'MIO',
      sort: 'Compatibilidad',
    }, offers).map(({ id }) => id)).toEqual([1]);
  });

  it('filters offers by inclusive departure date range', () => {
    const offers = [
      { id: 1, departure_date: '2026-10-25' },
      { id: 2, departure_date: '2026-10-26' },
      { id: 3, departure_date: '2026-10-27' },
    ];

    expect(filterTravelMatches({
      date_from: '2026-10-25',
      date_to: '2026-10-26',
    }, offers).map(({ id }) => id)).toEqual([1, 2]);
  });

  it('sorts offers by departure time, recency, or estimated score', () => {
    const offers = [
      { id: 'later', departure_date: '2026-10-26', time: '08:30', created_at: '2026-10-20T10:00:00Z', score: 60 },
      { id: 'early', departure_date: '2026-10-25', time: '20:15', created_at: '2026-10-19T10:00:00Z', score: 90 },
      { id: 'newest', departure_date: '2026-10-26', time: '07:00', created_at: '2026-10-21T10:00:00Z', score: 75 },
    ];

    expect(filterTravelMatches({ sort: 'Hora de salida' }, offers).map(({ id }) => id))
      .toEqual(['early', 'newest', 'later']);
    expect(filterTravelMatches({ sort: 'Más recientes' }, offers).map(({ id }) => id))
      .toEqual(['newest', 'later', 'early']);
    expect(filterTravelMatches({ sort: 'Compatibilidad' }, offers).map(({ id }) => id))
      .toEqual(['early', 'newest', 'later']);
  });

  it('places offers with invalid dates after dated offers when sorting by recency', () => {
    const offers = [
      { id: 'invalid', created_at: 'not-a-date' },
      { id: 'dated', created_at: '2026-10-21T10:00:00Z' },
    ];

    expect(filterTravelMatches({ sort: 'Más recientes' }, offers).map(({ id }) => id))
      .toEqual(['dated', 'invalid']);
  });

  it('keeps compatibility scoring bounded and explains recommendation factors', () => {
    const student = {
      neighborhood: 'El Caney',
      shift: 'Nocturna',
      transport: 'MIO + caminata',
      trustScore: 4.8,
    };
    const offer = {
      name: 'Ana',
      zone: 'El Caney',
      time: '19:45',
      transport: 'MIO + caminata',
      seats: 2,
      cost: '2500 COP',
    };

    expect(calculateCompatibilityScore(student, offer)).toBe(99);
    expect(buildMatchRecommendations(student, [offer])).toEqual([{
      traveler: 'Ana',
      score: 99,
      zone: 'El Caney',
      time: '19:45',
      mode: 'MIO + caminata',
      recommendation: 'Afinidad estimada 99% por barrio, transporte y jornada.',
    }]);
  });

  it('deduplicates and globally ranks recommendations across cursor pages', () => {
    const firstPage = [
      { id: 5, score: 50, traveler: 'First page' },
      { id: 8, score: 70, traveler: 'Updated on later page' },
    ];
    const nextPage = [
      { id: 8, score: 90, traveler: 'Updated on later page' },
      { id: 3, score: 70, traveler: 'Tie, lower offer id' },
    ];

    expect(mergeMatchRecommendations(firstPage, nextPage)).toEqual([
      { id: 8, score: 90, traveler: 'Updated on later page' },
      { id: 3, score: 70, traveler: 'Tie, lower offer id' },
      { id: 5, score: 50, traveler: 'First page' },
    ]);
  });

  it('rejects recommendations that cannot be ranked or deduplicated', () => {
    expect(() => mergeMatchRecommendations([], [{ id: 1, score: 'invalid' }]))
      .toThrow('La recomendación contiene datos inválidos.');
    expect(() => mergeMatchRecommendations([], [{ score: 80 }]))
      .toThrow('La recomendación contiene datos inválidos.');
  });
});
