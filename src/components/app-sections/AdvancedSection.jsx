export default function AdvancedSection() {
  return (
    <section style={{ display: 'grid', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#a3e635', fontWeight: 800 }}>MÓDULO 13</div>
        <h2 style={{ margin: '10px 0 12px', fontSize: 34 }}>Funcionalidades avanzadas</h2>
        <p style={{ color: '#cbd5e1', marginTop: 0 }}>
          Esta sección informa sobre capacidades aún no disponibles; no activa recomendaciones, predicciones ni monitoreo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 14 }}>
            <strong>Recomendaciones avanzadas</strong>
            <div style={{ color: '#fbbf24', marginTop: 6 }}>No disponibles</div>
            <small style={{ color: '#94a3b8' }}>No se predicen patrones ni mejores horarios.</small>
          </div>
          <div style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 14 }}>
            <strong>Hotspots y zonas de riesgo</strong>
            <div style={{ color: '#fbbf24', marginTop: 6 }}>Sin datos verificados</div>
            <small style={{ color: '#94a3b8' }}>La aplicación no presenta puntos seguros ni mapas de riesgo.</small>
          </div>
          <div style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 14 }}>
            <strong>Calendario universitario</strong>
            <div style={{ color: '#fbbf24', marginTop: 6 }}>No integrado</div>
            <small style={{ color: '#94a3b8' }}>Las jornadas y horarios no se sincronizan con calendarios institucionales.</small>
          </div>
          <div style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 14 }}>
            <strong>Modo nocturno y preferencias</strong>
            <div style={{ color: '#fbbf24', marginTop: 6 }}>Sin efecto funcional</div>
            <small style={{ color: '#94a3b8' }}>No hay ajustes de interfaz o seguridad configurables desde este módulo.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
