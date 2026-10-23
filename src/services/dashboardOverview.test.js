import { describe, expect, it } from 'vitest';
import { buildDashboardOverview } from './dashboardOverview';

const routeSummary = { distance: '5.2 km', duration: '18 min' };

describe('buildDashboardOverview', () => {
  it('reflects the actual email verification and calculated route state', () => {
    const cards = buildDashboardOverview({
      emailVerified: true,
      validEmail: true,
      emailDomain: '@uniajc.edu.co',
      routeMode: 'Carro',
      routeResult: { source: 'OSRM' },
      routeSummary,
    });

    expect(cards).toMatchObject([
      { key: 'email', value: 'Verificado' },
      { key: 'route', value: '5.2 km', detail: '18 min · OSRM' },
      { key: 'transport', value: 'Carro' },
      { key: 'emergency', value: 'Registro en la app' },
    ]);
  });

  it('does not claim a verified domain when it does not match the selected institution', () => {
    const [emailCard] = buildDashboardOverview({
      emailVerified: true,
      validEmail: false,
      emailDomain: '@uniajc.edu.co',
      routeMode: 'MIO + caminata',
      routeResult: null,
      routeSummary: { distance: 'Pendiente', duration: 'Pendiente' },
    });

    expect(emailCard).toMatchObject({
      value: 'Revisar dominio',
      detail: 'Dominio esperado: @uniajc.edu.co',
    });
  });

  it('reports no calculated route rather than substituting demo values', () => {
    const [, routeCard] = buildDashboardOverview({
      emailVerified: false,
      validEmail: false,
      emailDomain: '@uniajc.edu.co',
      routeMode: 'Bicicleta',
      routeResult: null,
      routeSummary: { distance: 'Pendiente', duration: 'Pendiente' },
    });

    expect(routeCard).toMatchObject({
      value: 'Sin calcular',
      detail: 'La seguridad y disponibilidad de la ruta no se evalúan.',
    });
  });
});
