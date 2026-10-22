import { completionAreas } from '../../data/appSectionData';

export default function ComplianceSection({ executionState, onToggleTask }) {
  const completedTasks = executionState.filter((task) => task.done).length;

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#f9a8d4', fontWeight: 800 }}>MÓDULO 15</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Checklist de cumplimiento ViajaU</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {completionAreas.map((area) => (
            <div key={area.label} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ fontWeight: 800 }}>{area.label}</div>
                <div style={{ color: '#f9a8d4', fontWeight: 800 }}>{area.progress}%</div>
              </div>
              <div style={{ marginTop: 12, height: 8, borderRadius: 999, background: 'rgba(148,163,184,.12)', overflow: 'hidden' }}>
                <div style={{ width: `${area.progress}%`, height: '100%', background: 'linear-gradient(90deg, #f472b6, #f9a8d4)' }} />
              </div>
              <div style={{ marginTop: 10, color: '#86efac', fontSize: 12, fontWeight: 700 }}>{area.status}</div>
              <div style={{ marginTop: 8, color: '#dbeafe', fontSize: 12 }}>{area.items}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>RESUMEN</div>
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div style={{ background: 'rgba(244,114,182,.09)', border: '1px solid rgba(244,114,182,.25)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>Cobertura funcional</div>
            <div style={{ marginTop: 4, color: '#fbcfe8' }}>97% del producto central cubierto en la propuesta funcional.</div>
          </div>
          <div style={{ background: 'rgba(52,211,153,.09)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>MVP viable</div>
            <div style={{ marginTop: 4, color: '#d1fae5' }}>Validación universitaria, matching por zona/horario, rutas, seguridad y dashboard completos.</div>
          </div>
          <div style={{ background: 'rgba(59,130,246,.09)', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>Pendientes reales</div>
            <div style={{ marginTop: 4, color: '#dbeafe' }}>Escala, integración con APIs de producción, persistencia y automatización avanzada.</div>
          </div>
          <div style={{ background: 'rgba(245,158,11,.09)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>Checklist operativo</div>
            <div style={{ marginTop: 4, color: '#fef3c7' }}>{completedTasks}/{executionState.length} tareas completadas del plan de ejecución.</div>
          </div>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
          {executionState.map((task) => (
            <button key={task.id} type="button" onClick={() => onToggleTask(task.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: task.done ? 'rgba(52,211,153,.08)' : 'rgba(15,23,42,.7)', border: `1px solid ${task.done ? 'rgba(52,211,153,.35)' : 'rgba(148,163,184,.2)'}`, borderRadius: 12, padding: '12px 14px', color: '#fff', textAlign: 'left' }}>
              <span>{task.label}</span>
              <span style={{ fontWeight: 800, color: task.done ? '#86efac' : '#fbbf24' }}>{task.done ? 'OK' : 'PEND'}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
