export default function AdminManagementSection(props) {
  return (
    <section style={{ display: 'grid', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#c4b5fd', fontWeight: 800 }}>MÓDULO 7</div>
            <h2 style={{ margin: '10px 0 6px', fontSize: 34 }}>Administración y analytics</h2>
            <div style={{ color: '#cbd5e1' }}>
              {props.currentAdminDashboard?.scope?.global
                ? 'Alcance: toda la plataforma'
                : `Alcance institucional: ${props.currentAdminDashboard?.scope?.university || props.authUser?.university || 'universidad sin asignar'}`}
            </div>
          </div>
          <button
            type="button"
            disabled={!props.currentAdminDashboard || props.adminDashboardLoading}
            onClick={props.exportAdminAnalytics}
            style={{ border: '1px solid rgba(196,181,253,.4)', borderRadius: 10, padding: '10px 14px', background: 'rgba(139,92,246,.16)', color: '#e9d5ff', fontWeight: 800, cursor: props.currentAdminDashboard ? 'pointer' : 'not-allowed' }}
          >
            Exportar métricas JSON
          </button>
        </div>

        {props.adminDashboardLoading && <p role="status" style={{ color: '#cbd5e1' }}>Cargando métricas verificadas del servidor…</p>}
        {props.adminDashboardError && <p role="alert" style={{ color: '#fca5a5' }}>{props.adminDashboardError}</p>}
        {props.currentAdminDashboard && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginTop: 20 }}>
              {[
                ['Usuarios registrados', props.currentAdminDashboard.stats.registered_users],
                ['Perfiles estudiantiles', props.currentAdminDashboard.stats.students],
                ['Ofertas activas', props.currentAdminDashboard.stats.active_trips],
                ['Viajes completados', props.currentAdminDashboard.stats.completed_trips],
                ['Solicitudes de cupo', props.currentAdminDashboard.stats.trip_requests],
                ['Solicitudes aceptadas', props.currentAdminDashboard.stats.accepted_requests],
                ['Aceptación de solicitudes', props.currentAdminDashboard.stats.request_acceptance_rate === null ? 'Sin datos' : `${props.currentAdminDashboard.stats.request_acceptance_rate}%`],
                ['Alertas sin resolver', props.currentAdminDashboard.stats.active_alerts],
                ['Coincidencias registradas', props.currentAdminDashboard.stats.matches],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(196,181,253,.3)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#d8b4fe', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value ?? 0}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 20 }}>
              {[
                ['Por universidad', props.currentAdminDashboard.distribution.by_university],
                ['Por barrio', props.currentAdminDashboard.distribution.by_neighborhood],
                ['Por jornada', props.currentAdminDashboard.distribution.by_shift],
              ].map(([title, rows]) => (
                <div key={title} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 16 }}>
                  <strong>{title}</strong>
                  {rows?.length
                    ? rows.map((row) => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10, color: '#cbd5e1' }}>
                        <span>{row.label}</span><span>{row.total}</span>
                      </div>
                    ))
                    : <div style={{ marginTop: 10, color: '#94a3b8' }}>Sin datos disponibles.</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>Checklist del módulo 7</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {props.adminChecklist.map((item) => (
            <div key={item.id} style={{ color: item.done ? '#86efac' : '#cbd5e1' }}>
              {item.done ? '☑' : '☐'} {item.id} {item.label}
            </div>
          ))}
        </div>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 0 }}>
          Las valoraciones de reputación siguen fuera de este módulo. La importación GTFS valida y guarda paradas/rutas; no importa viajes, horarios ni calendarios.
        </p>
      </div>

      {props.adminManagementError && (
        <div role="alert" style={{ color: '#fecaca', background: 'rgba(127,29,29,.3)', padding: 12, borderRadius: 10 }}>
          {props.adminManagementError}
        </div>
      )}
      {props.adminManagementLoading && <div role="status" style={{ color: '#cbd5e1' }}>Actualizando panel administrativo…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>Cuentas y verificación de perfiles</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              props.setAdminUserFilters((current) => ({ ...current, search: props.adminUserSearch, page: 1 }));
            }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}
          >
            <input
              aria-label="Buscar estudiante por nombre o correo"
              placeholder="Nombre o correo"
              value={props.adminUserSearch}
              onChange={(event) => props.setAdminUserSearch(event.target.value)}
              style={props.field}
            />
            <select
              aria-label="Filtrar estado de cuenta"
              value={props.adminUserFilters.status}
              onChange={(event) => props.setAdminUserFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
              style={props.field}
            >
              <option value="">Todos los estados</option>
              <option value="active">Activa</option>
              <option value="pending">Pendiente</option>
              <option value="blocked">Bloqueada</option>
            </select>
            <select
              aria-label="Filtrar verificación de perfil"
              value={props.adminUserFilters.verification}
              onChange={(event) => props.setAdminUserFilters((current) => ({ ...current, verification: event.target.value, page: 1 }))}
              style={props.field}
            >
              <option value="">Todos los perfiles</option>
              <option value="pending">Verificación pendiente</option>
              <option value="verified">Verificado</option>
            </select>
            <button type="submit" style={{ ...props.field, cursor: 'pointer', fontWeight: 800 }}>Buscar</button>
          </form>
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {props.adminUsers.map((user) => (
              <div key={user.id} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{user.name}</strong>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{user.email} · {user.university || 'Sin universidad'}</div>
                    <div style={{ color: '#cbd5e1', fontSize: 12 }}>
                      Cuenta: {user.status} · Perfil: {user.profile_verified ? 'verificado' : 'pendiente'} · Correo: {user.email_verified_at ? 'verificado' : 'pendiente'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {!user.profile_verified && (
                      <button
                        type="button"
                        disabled={props.adminManagementAction === `user-${user.id}`}
                        onClick={() => props.saveAdminUser(user, { profile_verified: true })}
                        style={props.field}
                      >
                        Verificar perfil
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={props.adminManagementAction === `user-${user.id}`}
                      onClick={() => props.saveAdminUser(user, { status: user.status === 'blocked' ? 'active' : 'blocked' })}
                      style={props.field}
                    >
                      {user.status === 'blocked' ? 'Reactivar' : 'Bloquear'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!props.adminUsers.length && !props.adminManagementLoading && <div style={{ color: '#94a3b8' }}>No hay cuentas para los filtros seleccionados.</div>}
          </div>
          {props.adminUserMeta.total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14, color: '#94a3b8', fontSize: 12 }}>
              <span>{props.adminUserMeta.total} cuentas · página {props.adminUserMeta.current_page} de {props.adminUserMeta.last_page}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" disabled={props.adminUserMeta.current_page <= 1} onClick={() => props.setAdminUserFilters((current) => ({ ...current, page: props.adminUserMeta.current_page - 1 }))} style={props.field}>Anterior</button>
                <button type="button" disabled={props.adminUserMeta.current_page >= props.adminUserMeta.last_page} onClick={() => props.setAdminUserFilters((current) => ({ ...current, page: props.adminUserMeta.current_page + 1 }))} style={props.field}>Siguiente</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ marginTop: 0 }}>Incidentes de seguridad</h3>
            <select
              aria-label="Filtrar incidentes por estado"
              value={props.adminIncidentStatus}
              onChange={(event) => {
                props.setAdminIncidentStatus(event.target.value);
                props.setAdminIncidentPage(1);
              }}
              style={props.field}
            >
              <option value="all">Todos</option>
              <option value="active">Sin resolver</option>
              <option value="resolved">Atendidos</option>
            </select>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {props.adminIncidents.map((incident) => (
              <div key={incident.id} style={{ border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 12 }}>
                <strong>{incident.type} · {incident.severity}</strong>
                <div style={{ color: '#cbd5e1', fontSize: 12 }}>{incident.student || 'Perfil eliminado'} · {incident.university || 'Universidad desconocida'}</div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  {incident.active ? 'Sin resolver' : 'Atendido'} · {incident.created_at ? new Date(incident.created_at).toLocaleString() : 'Fecha no disponible'}
                </div>
              </div>
            ))}
            {!props.adminIncidents.length && !props.adminManagementLoading && <div style={{ color: '#94a3b8' }}>No hay incidentes registrados en este alcance.</div>}
          </div>
          {props.adminIncidentMeta.total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14, color: '#94a3b8', fontSize: 12 }}>
              <span>{props.adminIncidentMeta.total} incidentes · página {props.adminIncidentMeta.current_page} de {props.adminIncidentMeta.last_page}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" disabled={props.adminIncidentMeta.current_page <= 1} onClick={() => props.setAdminIncidentPage(props.adminIncidentMeta.current_page - 1)} style={props.field}>Anterior</button>
                <button type="button" disabled={props.adminIncidentMeta.current_page >= props.adminIncidentMeta.last_page} onClick={() => props.setAdminIncidentPage(props.adminIncidentMeta.current_page + 1)} style={props.field}>Siguiente</button>
              </div>
            </div>
          )}
          <p style={{ color: '#94a3b8', fontSize: 12 }}>
            Este listado omite coordenadas y datos de contacto. La resolución operativa está disponible en el panel de seguridad.
          </p>
        </div>
      </div>

      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ marginTop: 0 }}>Catálogos institucionales</h3>
            <p style={{ color: '#94a3b8', marginTop: 0 }}>Gestiona sedes, facultades, programas y periodos. Los elementos se desactivan sin borrar su historial.</p>
          </div>
          {props.authUser?.role === 'admin' && (
            <label style={{ display: 'grid', gap: 6 }}>
              Universidad del catálogo
              <select value={props.adminSelectedUniversity} onChange={(event) => props.setAdminSelectedUniversity(event.target.value)} style={props.field}>
                <option value="">Selecciona universidad</option>
                {props.adminUniversities.map((university) => <option key={university} value={university}>{university}</option>)}
              </select>
            </label>
          )}
        </div>
        {props.adminSelectedUniversity || props.authUser?.role === 'university' ? (
          <>
            <form onSubmit={props.createAdminCatalogEntry} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
              <select
                value={props.adminCatalogForm.type}
                onChange={(event) => props.setAdminCatalogForm((current) => ({ ...current, type: event.target.value }))}
                style={props.field}
              >
                {props.catalogTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              <input
                required
                maxLength={120}
                value={props.adminCatalogForm.name}
                onChange={(event) => props.setAdminCatalogForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nombre del elemento"
                style={{ ...props.field, flex: 1, minWidth: 180 }}
              />
              <button type="submit" disabled={props.adminManagementAction === 'catalog'} style={{ ...props.field, cursor: 'pointer' }}>Agregar</button>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {props.adminCatalog.map((entry) => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: '1px solid rgba(148,163,184,.2)', borderRadius: 10, padding: 10 }}>
                  <span>{props.catalogTypes.find((type) => type.value === entry.type)?.label}: {entry.name}</span>
                  <button
                    type="button"
                    disabled={props.adminManagementAction === `catalog-${entry.id}`}
                    onClick={() => props.deactivateAdminCatalogEntry(entry)}
                    style={{ ...props.field, cursor: 'pointer' }}
                  >
                    Desactivar
                  </button>
                </div>
              ))}
              {!props.adminCatalog.length && <div style={{ color: '#94a3b8' }}>No hay elementos activos en este catálogo.</div>}
            </div>
          </>
        ) : <div style={{ color: '#fcd34d' }}>Selecciona una universidad para consultar o editar sus catálogos.</div>}
      </div>

      {props.authUser?.role === 'admin' && (
        <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>Importar datos estáticos GTFS</h3>
          <p style={{ color: '#cbd5e1' }}>
            Importa `stops.txt` y `routes.txt` (CSV UTF-8) de un feed de Metro Cali. Se verifican encabezados, IDs únicos, nombres y coordenadas; el máximo es 50.000 filas por archivo. No se importan ni publican horarios ni calendarios.
          </p>
          <form onSubmit={props.submitAdminTransitFeed} style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              Versión o fecha del feed
              <input required maxLength={120} value={props.adminFeedVersion} onChange={(event) => props.setAdminFeedVersion(event.target.value)} style={props.field} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              stops.txt
              <input required type="file" accept=".txt,.csv,text/csv,text/plain" onChange={(event) => props.setAdminStopsFile(event.target.files?.[0] || null)} style={props.field} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              routes.txt
              <input required type="file" accept=".txt,.csv,text/csv,text/plain" onChange={(event) => props.setAdminRoutesFile(event.target.files?.[0] || null)} style={props.field} />
            </label>
            <button type="submit" disabled={props.adminManagementAction === 'gtfs'} style={{ ...props.field, cursor: 'pointer', fontWeight: 800 }}>
              {props.adminManagementAction === 'gtfs' ? 'Validando…' : 'Validar e importar'}
            </button>
          </form>
          {props.adminLatestFeed && (
            <div role="status" style={{ marginTop: 14, color: '#86efac' }}>
              Último feed: {props.adminLatestFeed.feed_version} · {props.adminLatestFeed.stops_count} paradas · {props.adminLatestFeed.routes_count} rutas
            </div>
          )}
        </div>
      )}
    </section>
  );
}
