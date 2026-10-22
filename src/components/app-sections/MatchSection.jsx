import { matchFunctions } from '../../data/appSectionData';

export default function MatchSection({
  matchLoading,
  matchError,
  matchLoaded,
  matchProfileAvailable,
  matchResults,
  matchTruncated,
  field,
  onLoadMore,
  onNavigate,
  onViewOffers,
}) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#a7f3d0', fontWeight: 800 }}>MÓDULO 4</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Emparejamiento de viajes</h2>
        <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>Recomendaciones calculadas desde ofertas activas y verificadas, comparando tu zona, jornada y transporte. No son una garantía de seguridad.</p>
        {matchLoading && <div role="status" style={{ color: '#bae6fd', marginTop: 16 }}>Buscando viajes compatibles…</div>}
        {matchError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10, marginTop: 16 }}>{matchError}</div>}
        {!matchLoading && !matchError && matchLoaded && !matchProfileAvailable && (
          <div role="status" style={{ color: '#fde68a', background: 'rgba(120,53,15,.25)', padding: 12, borderRadius: 10, marginTop: 16 }}>
            Completa y verifica tu perfil de estudiante para recibir recomendaciones.
          </div>
        )}
        {!matchLoading && !matchError && matchLoaded && matchProfileAvailable && !matchTruncated && matchResults.length === 0 && (
          <div role="status" style={{ color: '#cbd5e1', background: 'rgba(148,163,184,.08)', padding: 16, borderRadius: 12, marginTop: 16 }}>
            Aún no hay ofertas verificadas que coincidan con tu zona, jornada o transporte.
            <button type="button" onClick={() => onNavigate('search')} style={{ ...field, display: 'block', marginTop: 12, padding: '8px 12px', cursor: 'pointer' }}>Buscar todas las ofertas</button>
          </div>
        )}
        {!matchLoading && !matchError && matchLoaded && matchProfileAvailable && matchTruncated && matchResults.length === 0 && (
          <div role="status" style={{ color: '#cbd5e1', marginTop: 16 }}>
            Este grupo no contiene coincidencias; puedes continuar con el siguiente.
          </div>
        )}
        <div style={{ display: 'grid', gap: 14 }}>
          {matchResults.map((match) => (
            <div key={match.id} style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(52,211,153,.3)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{match.traveler}</div>
                  <div style={{ color: '#cbd5e1' }}>{match.zone} • {match.time}</div>
                </div>
                <div style={{ background: 'rgba(16,185,129,.14)', borderRadius: 999, padding: '8px 12px', fontWeight: 800, color: '#a7f3d0' }}>{match.score}% coincidencia</div>
              </div>
              <div style={{ marginTop: 8, color: '#dbeafe' }}>Modo: {match.mode} • {match.seats} cupo(s) • {match.cost}</div>
              <ul style={{ margin: '10px 0', paddingLeft: 20, color: '#bbf7d0' }}>{match.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              <button type="button" onClick={() => onViewOffers(match)} style={{ ...field, padding: '8px 12px', cursor: 'pointer' }}>Ver ofertas</button>
            </div>
          ))}
        </div>
        {!matchLoading && matchLoaded && matchTruncated && (
          <button type="button" onClick={onLoadMore} style={{ ...field, marginTop: 12, padding: '9px 12px', cursor: 'pointer' }}>
            Cargar más recomendaciones
          </button>
        )}
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>RECOMENDACIÓN</div>
        <div style={{ marginTop: 12, color: '#cbd5e1' }}>El puntaje es explicable: zona 50%, jornada 35% y transporte 15%. Solo se consideran datos declarados y ofertas publicadas; se muestran coincidencias desde 30 puntos.</div>
        <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{matchFunctions.map((item) => <span key={item} style={{ padding: '6px 8px', fontSize: 10, borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#d1fae5' }}>{item}</span>)}</div>
        <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 20, paddingTop: 16 }}>
          <strong>Checklist del módulo 4</strong>
          <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 13 }}>
            {[
              { label: '4.1 Leer perfil propio verificado sin usar datos de demostración', done: matchLoaded && matchProfileAvailable },
              { label: '4.2 Encontrar ofertas activas de otros estudiantes verificados', done: true },
              { label: '4.3 Comparar barrio con origen y destino publicados', done: true },
              { label: '4.4 Comparar hora con la jornada declarada', done: true },
              { label: '4.5 Comparar transporte declarado con el de la oferta', done: true },
              { label: '4.6 Mostrar puntaje explicable y motivos de coincidencia', done: true },
              { label: '4.7 Proteger datos privados y probar acceso y filtros', done: true },
            ].map((item) => <div key={item.label} style={{ color: item.done ? '#86efac' : '#cbd5e1' }}>{item.done ? '☑' : '☐'} {item.label}</div>)}
          </div>
          <small style={{ display: 'block', marginTop: 8, color: '#94a3b8' }}>{6 + Number(matchLoaded && matchProfileAvailable)}/7 completados. El paso pendiente es cargar las recomendaciones del perfil actual; los controles de cupo pertenecen al módulo de gestión de viajes.</small>
        </div>
      </div>
    </section>
  );
}
