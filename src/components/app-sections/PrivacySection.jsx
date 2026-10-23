import Metric from '../Metric';
import { privacyFunctions } from '../../data/appSectionData';

export default function PrivacySection() {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 11</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Privacidad y seguridad del backend</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <Metric label="Autenticación" value="Sanctum" color="#38bdf8" />
          <Metric label="Ubicación" value="Consentida" color="#7dd3fc" />
          <Metric label="Retención GPS" value="Temporal" color="#34d399" />
          <Metric label="Derechos de datos" value="Pendientes" color="#fca5a5" />
        </div>
        <div style={{ marginTop: 20, background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.24)', borderRadius: 14, padding: 16, color: '#dbeafe' }}>
          La ubicación exacta puede compartirse durante un viaje con participantes autorizados. Su eliminación depende de la retención temporal y de que el planificador del servidor esté operativo. Las solicitudes de acceso, exportación y eliminación de datos aún no tienen un flujo automatizado; esta vista no acredita una auditoría ni certificación externa.
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>SEGURIDAD</div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {privacyFunctions.map((item) => <span key={item} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(56,189,248,.12)', color: '#dbeafe' }}>{item}</span>)}
        </div>
      </div>
    </section>
  );
}
