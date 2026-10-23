import { Suspense, lazy } from 'react';
import Metric from '../Metric';

const RouteMap = lazy(() => import('../RouteMap'));

export default function RoutesSection({
  route,
  routeLocations,
  routeSearchResults,
  routeSearchLoading,
  routeLoading,
  routeError,
  routeResult,
  deviceLocation,
  locationLoading,
  summary,
  field,
  onChangeLocation,
  onSearchLocation,
  onUseDeviceLocation,
  onSelectLocation,
  onChangeMode,
  onChangeTime,
  onCalculateRoute,
}) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 2</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Mapa, geolocalización y rutas</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {['origin', 'destination'].map((fieldName) => (
            <div key={fieldName} style={{ display: 'grid', gap: 8 }}>
              <label htmlFor={`route-${fieldName}`} style={{ fontWeight: 700 }}>
                {fieldName === 'origin' ? 'Origen' : 'Destino'}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  id={`route-${fieldName}`}
                  value={route[fieldName]}
                  onChange={(event) => onChangeLocation(fieldName, event.target.value)}
                  style={{ ...field, flex: '1 1 230px' }}
                  placeholder="Busca un lugar en Cali"
                />
                <button
                  type="button"
                  onClick={() => onSearchLocation(fieldName)}
                  disabled={routeSearchLoading === fieldName}
                  style={{ ...field, cursor: 'pointer' }}
                >
                  {routeSearchLoading === fieldName ? 'Buscando…' : 'Buscar lugar'}
                </button>
                {fieldName === 'origin' && (
                  <button type="button" onClick={onUseDeviceLocation} disabled={locationLoading} style={{ ...field, cursor: 'pointer' }}>
                    {locationLoading ? 'Obteniendo GPS…' : 'Usar mi ubicación'}
                  </button>
                )}
              </div>
              {routeSearchResults[fieldName].length > 0 && (
                <div role="listbox" aria-label={`Resultados para ${fieldName === 'origin' ? 'origen' : 'destino'}`} style={{ display: 'grid', gap: 6 }}>
                  {routeSearchResults[fieldName].map((result) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      key={result.id}
                      onClick={() => onSelectLocation(fieldName, result)}
                      style={{ ...field, textAlign: 'left', cursor: 'pointer' }}
                    >
                      {result.fullName}
                    </button>
                  ))}
                </div>
              )}
              <small style={{ color: '#94a3b8' }}>Búsqueda geográfica: © OpenStreetMap contributors (Nominatim).</small>
              <small style={{ color: routeLocations[fieldName] ? '#86efac' : '#fbbf24' }}>
                {routeLocations[fieldName] ? 'Coordenadas seleccionadas' : 'Selecciona un resultado para fijar las coordenadas'}
              </small>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Modo</span>
              <select value={route.mode} onChange={(event) => onChangeMode(event.target.value)} style={field}>
                <option value="MIO + caminata">MIO (paradas y trazados oficiales)</option>
                <option>Carro</option><option>Moto (usa ruta vial genérica)</option><option>Bicicleta</option><option>Caminata</option><option>Taxi</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Hora</span>
              <input value={route.time} onChange={(event) => onChangeTime(event.target.value)} style={field} />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: '#93c5fd', fontWeight: 700 }}>Ruta real según el perfil de transporte seleccionado</div>
            <button onClick={onCalculateRoute} disabled={routeLoading} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 18px', fontWeight: 800, cursor: routeLoading ? 'wait' : 'pointer' }}>
              {routeLoading ? 'Calculando…' : 'Calcular ruta'}
            </button>
          </div>
          {routeError && <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10 }}>{routeError}</div>}
          {routeResult?.mode === 'mio' && (
            <div style={{ color: '#fde68a', background: 'rgba(120,53,15,.25)', padding: 12, borderRadius: 10 }}>
              El trazado y las paradas provienen de datos públicos de Metro Cali. Este servicio no ofrece un calendario activo para verificar próximas salidas; por eso no se muestra una hora de llegada ni una frecuencia.
              {routeResult.routes?.length > 0 && ` Línea(s): ${routeResult.routes.join(', ')}.`}
              {routeResult.stopDetails?.length > 0 && ` Paradas: ${routeResult.stopDetails.map(({ role, code }) => `${role} ${code}`).join(' · ')}.`}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>
            Tu ubicación solo se obtiene con permiso y no se guarda en la app. Al calcular, las coordenadas se envían al proveedor correspondiente. Se ofrecen rutas viales para carro/taxi, rutas peatonales/ciclistas de OpenStreetMap y rutas genéricas de carro para moto. MIO usa paradas y trazados del servicio público de Metro Cali; no hay un calendario activo verificable, así que no se muestran horarios ni frecuencias.
          </div>
          <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', paddingTop: 14 }}>
            <strong>Capacidades y límites de las rutas</strong>
            <ul style={{ display: 'grid', gap: 8, margin: '10px 0 0', paddingLeft: 20, color: '#cbd5e1', fontSize: 13 }}>
              <li>La ubicación del dispositivo requiere permiso del navegador; se usa para esta sesión y no se guarda en la aplicación.</li>
              <li>La búsqueda de lugares usa Nominatim; el trazado vial depende de proveedores externos OSRM/OpenStreetMap.</li>
              <li>Carro, taxi, caminata y bicicleta usan perfiles disponibles del proveedor; moto usa una ruta genérica de carro. No se evalúa la seguridad del recorrido.</li>
              <li>El MIO muestra paradas y trazados públicos, pero no dispone aquí de horarios o frecuencias verificables.</li>
              <li>{routeResult ? `La vista actual muestra una ruta de modo ${routeResult.mode} recibida de ${routeResult.source}.` : 'No hay una ruta calculada en esta vista.'}</li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>RESUMEN</div>
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          <Metric label="Tiempo estimado" value={summary.duration} color="#7dd3fc" />
          <Metric label="Distancia" value={summary.distance} color="#86efac" />
          <Metric label="Fuente" value={routeResult?.source || 'Sin ruta calculada'} color="#c4b5fd" />
          <Metric label="Origen" value={route.origin} color="#67e8f9" />
        </div>
        <div style={{ marginTop: 14, background: 'rgba(103,232,249,0.08)', border: '1px solid rgba(103,232,249,0.24)', borderRadius: 12, padding: 12, color: '#dbeafe' }}>
          {routeResult ? `Ruta recibida de ${routeResult.source}. La seguridad del trayecto no ha sido evaluada.` : 'Las distancias y tiempos aparecerán cuando elijas origen y destino y se calcule una ruta real.'}
        </div>
      </div>
      <div style={{ gridColumn: '1 / -1', background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 16 }}>
        <Suspense fallback={<div role="status" style={{ height: 340 }}>Cargando mapa…</div>}>
          <RouteMap origin={routeLocations.origin} destination={routeLocations.destination} route={routeResult} userLocation={deviceLocation} />
        </Suspense>
        <small style={{ display: 'block', marginTop: 8, color: '#94a3b8' }}>Mapa © OpenStreetMap contributors</small>
      </div>
    </section>
  );
}
