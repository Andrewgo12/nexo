import Metric from '../Metric';
import { advancedFunctions } from '../../data/appSectionData';

const advancedFeatures = {
  night: 'activarModoNocturno()',
  safeties: 'sugerirRutasMasSeguras()',
  hotspots: 'mostrarHotspotsDeViaje()',
  recommendations: 'recomendarMejorHorario()',
};

export default function AdvancedSection({ advancedMode, onToggleFeature }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#a3e635', fontWeight: 800 }}>MÓDULO 13</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Funcionalidades avanzadas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <Metric label="Modo nocturno" value={advancedMode.night ? 'Activo' : 'Inactivo'} color="#a3e635" />
          <Metric label="Puntos seguros" value="17" color="#bef264" />
          <Metric label="Hotspots" value="5" color="#65a30d" />
          <Metric label="Uniones frecuentes" value="12" color="#4ade80" />
        </div>
        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          {Object.entries(advancedFeatures).map(([key, label]) => (
            <button key={key} type="button" onClick={() => onToggleFeature(key)} style={{ border: advancedMode[key] ? '1px solid rgba(163,230,53,.4)' : '1px solid rgba(148,163,184,.2)', background: advancedMode[key] ? 'rgba(163,230,53,.12)' : 'rgba(15,23,42,.8)', borderRadius: 12, padding: '12px 14px', color: '#fff', textAlign: 'left', fontWeight: 700 }}>
              {label} • {advancedMode[key] ? 'ON' : 'OFF'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>INTELIGENCIA</div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {advancedFunctions.map((item) => <span key={item} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(163,230,53,.12)', color: '#ecfccb' }}>{item}</span>)}
        </div>
      </div>
    </section>
  );
}
