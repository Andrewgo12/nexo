import Metric from '../Metric';
import { backendFunctions } from '../../data/appSectionData';

export default function BackendSection() {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#fb7185', fontWeight: 800 }}>MÓDULO 14</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Infraestructura y backend</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <Metric label="Cache rutas" value="Activo" color="#fda4af" />
          <Metric label="GTFS sync" value="OK" color="#fb7185" />
          <Metric label="Sistema" value="95.4%" color="#34d399" />
          <Metric label="Backups" value="Diarios" color="#fbbf24" />
        </div>
        <div style={{ marginTop: 20, background: 'rgba(251,113,133,.08)', border: '1px solid rgba(251,113,133,.22)', borderRadius: 14, padding: 16, color: '#ffe4e6' }}>
          El backend requiere manejo de caché, sincronización GTFS, colas de notificaciones, monitoreo de salud del sistema y logs de auditoría para crecer sin fallar.
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>CORE BACKEND</div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {backendFunctions.map((item) => <span key={item} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(251,113,133,.12)', color: '#ffe4e6' }}>{item}</span>)}
        </div>
      </div>
    </section>
  );
}
