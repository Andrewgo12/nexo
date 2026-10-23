import { searchFunctions } from '../../data/appSectionData';

export default function SearchSection({
  searchState,
  universities,
  filteredResults,
  searchLoading,
  searchError,
  searchLoaded,
  searchTruncated,
  field,
  onFilterChange,
  onLoadMore,
  onSortChange,
  onClearFilters,
}) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 3</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Búsqueda, filtros y ordenamiento</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}><span>Zona de origen o destino</span><input value={searchState.zone} onChange={(event) => onFilterChange('zone', event.target.value)} style={field} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Hora de salida</span><input type="time" value={searchState.time} onChange={(event) => onFilterChange('time', event.target.value)} style={field} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Programa o carrera</span><input value={searchState.faculty} onChange={(event) => onFilterChange('faculty', event.target.value)} style={field} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Universidad</span><select value={searchState.university} onChange={(event) => onFilterChange('university', event.target.value)} style={field}><option>Cualquiera</option>{universities.map((university) => <option key={university.id}>{university.name}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Transporte</span><select value={searchState.transport} onChange={(event) => onFilterChange('transport', event.target.value)} style={field}><option>Cualquiera</option><option>MIO</option><option>Carro</option><option>Moto</option><option>Bicicleta</option><option>Caminata</option><option>Taxi</option></select></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Desde</span><input type="date" value={searchState.date_from} onChange={(event) => onFilterChange('date_from', event.target.value)} style={field} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Hasta</span><input type="date" min={searchState.date_from || undefined} value={searchState.date_to} onChange={(event) => onFilterChange('date_to', event.target.value)} style={field} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Orden</span><select value={searchState.sort} onChange={(event) => onSortChange(event.target.value)} style={field}><option>Compatibilidad</option><option>Hora de salida</option><option>Más recientes</option></select></label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
          <small style={{ color: '#94a3b8' }}>La hora filtra dentro de la misma hora. Las reseñas son opiniones de otros participantes; no verifican identidad ni garantizan seguridad.</small>
          <button type="button" onClick={onClearFilters} style={{ ...field, padding: '8px 12px', cursor: 'pointer' }}>Limpiar filtros</button>
        </div>
        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          {searchLoading && <div role="status" style={{ color: '#bae6fd' }}>Buscando ofertas publicadas…</div>}
          {searchError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10 }}>{searchError}</div>}
          {!searchLoading && !searchError && searchLoaded && !searchTruncated && filteredResults.length === 0 && (
            <div role="status" style={{ color: '#cbd5e1', background: 'rgba(148,163,184,.08)', padding: 16, borderRadius: 12 }}>
              No hay ofertas activas que coincidan con estos filtros. Prueba otra zona, hora o transporte.
            </div>
          )}
          {!searchLoading && !searchError && searchLoaded && searchTruncated && filteredResults.length === 0 && (
            <div role="status" style={{ color: '#cbd5e1' }}>
              Esta página no contiene ofertas coincidentes con los filtros locales; puedes cargar más resultados.
            </div>
          )}
          {!searchError && filteredResults.map((item) => (
            <div key={item.id} style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(96,165,250,.28)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{item.name}</div>
                <div style={{ color: '#93c5fd', fontWeight: 800 }}>{item.score}% afinidad estimada</div>
              </div>
              <div style={{ marginTop: 6, color: '#dbeafe' }}>{item.origin} → {item.destination} • {item.departure_date} {item.time} • {item.transport}</div>
              <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 13 }}>{item.university}{item.faculty ? ` • ${item.faculty}` : ''} • {item.seats} cupo(s) • {item.cost} • {item.rating_average === null ? 'Sin reseñas' : `${item.rating_average}/5 (${item.rating_count})`}</div>
            </div>
          ))}
          {!searchLoading && searchLoaded && searchTruncated && (
            <button type="button" onClick={onLoadMore} style={{ ...field, padding: '9px 12px', cursor: 'pointer' }}>
              Cargar más ofertas
            </button>
          )}
        </div>
        <small style={{ display: 'block', marginTop: 12, color: '#94a3b8' }}>La afinidad estima coincidencias de barrio, transporte y jornada declarados; no representa una calificación de seguridad ni reputación.</small>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>FILTROS</div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{searchFunctions.map((item) => <span key={item} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(125,211,252,.12)', color: '#dbeafe' }}>{item}</span>)}</div>
        <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 20, paddingTop: 16 }}>
          <strong>Alcance de búsqueda</strong>
          <ul style={{ display: 'grid', gap: 8, margin: '10px 0 0', paddingLeft: 20, color: '#cbd5e1', fontSize: 13 }}>
            <li>El servidor filtra ofertas activas y futuras de perfiles verificados; las páginas usan un cursor estable.</li>
            <li>Zona, hora, fechas, transporte, carrera y universidad son filtros del servidor. Afinidad y orden se calculan solo entre resultados cargados.</li>
            <li>No se filtra por género ni por distancia exacta; no se solicitan coordenadas para esta búsqueda.</li>
            <li>{searchLoaded && !searchError ? 'La última consulta terminó correctamente.' : 'El resultado depende de la próxima consulta autenticada.'}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
