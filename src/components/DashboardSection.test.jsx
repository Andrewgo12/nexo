import { describe, expect, it } from 'vitest';
import { buildDashboardSummary } from '../services/dashboardSummary';

const statusLabels = { accepted: 'Aceptada', rejected: 'Rechazada' };

describe('buildDashboardSummary', () => {
  it('aggregates owned offers, accepted passenger trips, pending requests, activity, and history', () => {
    const summary = buildDashboardSummary({
      offers: [{
        id: 1,
        origin: 'Centro',
        destination: 'Campus',
        departure_date: '2099-05-12',
        departure_time: '18:00',
        status: 'oferta-activa',
        requests: [{ id: 11, status: 'pending', requester: { name: 'Ana' } }],
      }],
      requests: [
        {
          id: 21,
          status: 'accepted',
          offer: { id: 2, origin: 'Norte', destination: 'Campus', departure_date: '2099-05-12', departure_time: '19:00', status: 'en-curso' },
        },
        {
          id: 22,
          status: 'pending',
          offer: { id: 3, origin: 'Sur', destination: 'Campus', departure_date: '2099-05-12', departure_time: '20:00', status: 'oferta-activa' },
        },
      ],
    }, { summary: { rating_average: 4.5, rating_count: 2 } }, statusLabels);

    expect(summary.metrics).toEqual([
      { label: 'Ofertas activas', value: 1, color: '#f472b6' },
      { label: 'Viajes en curso', value: 1, color: '#c084fc' },
      { label: 'Viajes completados', value: 0, color: '#34d399' },
      { label: 'Solicitudes pendientes', value: 2, color: '#fbbf24' },
      { label: 'Calificación', value: '4.5/5 (2)', color: '#f9a8d4' },
    ]);
    expect(summary.activity).toEqual([
      { key: 'incoming-11', label: 'Solicitud de cupo de Ana', detail: 'Centro → Campus' },
      { key: 'outgoing-21', label: 'Tu solicitud fue Aceptada', detail: 'Norte → Campus' },
    ]);
    expect(summary.history).toHaveLength(3);
    expect(summary.history[1].status).toBe('accepted');
    expect(summary.upcoming).toHaveLength(1);
    expect(summary.upcoming[0]).toMatchObject({ id: 1, role: 'Responsable' });
  });

  it('lists future active accepted passenger trips in chronological order only', () => {
    const summary = buildDashboardSummary({
      offers: [
        {
          id: 1,
          origin: 'Centro',
          destination: 'Campus',
          departure_date: '2099-05-13',
          departure_time: '08:30:00',
          status: 'oferta-activa',
          requests: [],
        },
        {
          id: 2,
          origin: 'Sur',
          destination: 'Campus',
          departure_date: '2099-05-11',
          departure_time: '20:00',
          status: 'completada',
          requests: [],
        },
      ],
      requests: [
        {
          id: 21,
          status: 'accepted',
          offer: {
            id: 3,
            origin: 'Norte',
            destination: 'Campus',
            departure_date: '2099-05-12',
            departure_time: '18:00',
            status: 'oferta-activa',
          },
        },
        {
          id: 22,
          status: 'pending',
          offer: {
            id: 4,
            origin: 'Oeste',
            destination: 'Campus',
            departure_date: '2099-05-12',
            departure_time: '17:00',
            status: 'oferta-activa',
          },
        },
      ],
    }, null, statusLabels);

    expect(summary.upcoming.map(({ id, role }) => [id, role])).toEqual([
      [3, 'Pasajero'],
      [1, 'Responsable'],
    ]);
  });
});
