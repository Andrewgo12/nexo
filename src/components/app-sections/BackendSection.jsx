import { useEffect, useState } from 'react';
import Metric from '../Metric';
import { getServiceReadiness } from '../../services/authApi';

export default function BackendSection() {
  const [readiness, setReadiness] = useState({ status: 'loading', error: '' });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getServiceReadiness(controller.signal)
      .then((response) => {
        if (response.status !== 'ready' || response.checks?.database !== 'ok') {
          throw new Error('El servidor devolvió un estado de disponibilidad inválido.');
        }
        setReadiness({ status: 'ready', error: '' });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setReadiness({
            status: 'unavailable',
            error: error.message || 'No fue posible consultar la disponibilidad del backend.',
          });
        }
      });

    return () => controller.abort();
  }, [retryCount]);

  const retryReadiness = () => {
    setReadiness({ status: 'loading', error: '' });
    setRetryCount((count) => count + 1);
  };

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fb7185', fontWeight: 800 }}>MÓDULO 14</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Infraestructura y backend</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <Metric label="API" value="Laravel" color="#fda4af" />
          <Metric label="Pruebas" value="PHPUnit" color="#fb7185" />
          <Metric
            label="API y base de datos"
            value={readiness.status === 'loading' ? 'Consultando' : readiness.status === 'ready' ? 'Disponibles' : 'No disponibles'}
            color={readiness.status === 'ready' ? '#34d399' : readiness.status === 'loading' ? '#fbbf24' : '#fb7185'}
          />
          <Metric label="Monitoreo y backups" value="No medidos" color="#94a3b8" />
        </div>
        {readiness.status === 'unavailable' && (
          <div style={{ marginTop: 16, background: 'rgba(127,29,29,.3)', border: '1px solid rgba(248,113,113,.35)', borderRadius: 12, padding: 14, color: '#fecaca' }}>
            <div role="alert">No se pudo confirmar que la API y la base de datos estén disponibles: {readiness.error}</div>
            <button
              type="button"
              onClick={retryReadiness}
              style={{ marginTop: 12, border: '1px solid rgba(248,113,113,.5)', borderRadius: 8, padding: '8px 12px', background: 'rgba(127,29,29,.45)', color: '#fff', cursor: 'pointer' }}
            >
              Reintentar consulta
            </button>
          </div>
        )}
        <div style={{ marginTop: 20, background: 'rgba(251,113,133,.08)', border: '1px solid rgba(251,113,133,.22)', borderRadius: 14, padding: 16, color: '#ffe4e6' }}>
          La disponibilidad se consulta en vivo desde el endpoint de readiness. Este panel no mide uptime histórico, sincronización GTFS ni copias de seguridad; deben configurarse y verificarse en el entorno de operación.
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>ALCANCE IMPLEMENTADO</div>
        <p style={{ marginTop: 16, color: '#e2e8f0', lineHeight: 1.6 }}>
          La API incluye autenticación, perfiles, búsqueda, ofertas, matching y solicitudes de viaje. El estado de producción y la disponibilidad de servicios externos no se infieren desde esta pantalla.
        </p>
      </div>
    </section>
  );
}
