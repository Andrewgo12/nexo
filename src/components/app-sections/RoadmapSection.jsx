import { roadmapPhases } from '../../data/appSectionData';

export default function RoadmapSection() {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#67e8f9', fontWeight: 800 }}>MÓDULO 16</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Roadmap de implementación</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          {roadmapPhases.map((item) => (
            <div key={item.phase} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800 }}>{item.phase}</div>
                <div style={{ color: '#67e8f9', fontWeight: 800 }}>{item.status}</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800 }}>{item.title}</div>
              <div style={{ marginTop: 6, color: '#dbeafe' }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>OBJETIVO</div>
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div style={{ background: 'rgba(103,232,249,.08)', border: '1px solid rgba(103,232,249,.25)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>Prioridad real</div>
            <div style={{ marginTop: 4, color: '#cffafe' }}>Alinear MVP con validación, rutas, matching y seguridad antes de escalar a monetización e infraestructura.</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>Criterio de éxito</div>
            <div style={{ marginTop: 4, color: '#dcfce7' }}>Que la app pueda conectar estudiantes reales por barrio, horario y ruta con confianza y vigilancia mínima.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
