# ViajaU

> **Estado documentado:** revisión del checkout en el commit `2408f19` (23 de octubre de 2026), con cambios locales en curso. Las versiones prefijadas con `^` en los manifiestos son rangos permitidos; las versiones bloqueadas corresponden a los lockfiles inspeccionados. El estado funcional no equivale a autorización para operar un servicio de transporte o de emergencia en producción.

## 1. Estado actual del proyecto

- **Fase de desarrollo:** MVP en desarrollo. La aplicación tiene cliente React y API Laravel funcionales, pero hay integraciones externas opcionales y áreas incompletas. No se declara lista para producción.
- **Verificación observada en este checkout:**
  - `npm run test:unit`: 30 archivos, 142 pruebas aprobadas.
  - `npm run test:coverage`: 30 archivos, 142 pruebas aprobadas; 28,40 % líneas, 27,65 % sentencias, 26,58 % ramas y 20,78 % funciones. Se cumplieron los pisos globales configurados (9 % líneas/sentencias y 7 % ramas/funciones); esta cobertura frontend no representa la cobertura del backend.
  - `npm run test:routing`: correcto; prueba contratos del cliente con respuestas simuladas, no una API desplegada.
  - `npm run lint:product`: correcto; Oxlint terminó sin diagnósticos con `--deny-warnings`.
  - `npm run build`: correcto; Vite completó la compilación de producción.
  - Backend: PHPUnit pasó 140 pruebas y 895 aserciones con `pdo_sqlite` y `sqlite3` habilitados para ese proceso. No hay reporte porcentual configurado para PHPUnit.
  - `node scripts/test-viajau-functions.js`: diagnóstico exploratorio de 9 casos sin excepciones; no valida resultados y captura errores sin fallar el proceso, por lo que no cuenta como suite de pruebas.
  - `npm run lint:react-bits`: ESLint finalizó sin errores ni advertencias en la ejecución de referencia.
  - `npm --prefix react-bits-main run build`: no completó en la ejecución de referencia; Vite alcanzó el límite de heap de Node (~2 GB) durante `transforming`. No se afirma que ese subproyecto haya generado un build de producción.
- **Automatización:** `Product CI` cubre build, pruebas, cobertura frontend y lint del producto, además de PHPUnit en Ubuntu/PHP 8.4 con SQLite. `React Bits CI` valida el subproyecto embebido en su propio entorno.

| # | Módulo de producto | Estado | Alcance confirmado y límites |
|---:|---|---|---|
| 1 | Usuarios y validación institucional | Parcial | Registro, login, verificación de correo, perfil, recuperación de contraseña, roles y bloqueo. La entrega de correo depende de configuración SMTP; se requiere verificación institucional antes de usar la mayoría de rutas privadas. |
| 2 | Mapa, rutas y geolocalización | Parcial | Geolocalización explícita, búsqueda Nominatim, rutas OSRM/OpenStreetMap con URL autoalojable configurable y consulta de paradas/trazados públicos del MIO. Moto usa el perfil genérico de carro; no se calcula puntuación de seguridad. No hay calendario GTFS activo; el grafo OSRM de Colombia está en preparación y todavía no se ha validado una ruta local. |
| 3 | Búsqueda, filtros y ordenamiento | Parcial | Endpoint autenticado filtra zona, hora, transporte, carrera, universidad y rango inclusivo de fechas; limita resultados a perfiles verificados y pagina de forma estable. Ordenamiento de los resultados cargados en cliente, con fecha antes de hora de salida. No usa filtros de género ni distancia exacta. |
| 4 | Match por zona y horario | Completado dentro del alcance actual | Recomendaciones calculadas en backend sobre ofertas verificadas, zona, jornada/hora y transporte; no son una calificación de seguridad ni usan reputación para certificar viajes. |
| 5 | Gestión de viajes | Parcial | Ofertas, solicitudes, aceptación/rechazo, transiciones de estado, cupos y participantes. Las ofertas disponibles y ambos historiales personales recorren páginas con cursores estables y deduplicación; las listas personales de ofertas y solicitudes avanzan de forma independiente. La publicación exige fecha y hora futuras; búsqueda y recomendaciones omiten ofertas vencidas y la interfaz muestra la fecha. La estimación orientativa de aporte solo se habilita con distancia de una ruta calculada y no procesa pagos. Ofertas históricas sin fecha permanecen en la base de datos, pero no se ofrecen públicamente. |
| 6 | Seguridad y ubicación | Parcial | SOS, seguimiento GPS consentido por viaje, check-ins y colas de notificación. La geocerca automática está desactivada en ofertas nuevas y rutas históricas no verificadas: la API rechaza rutas aportadas por el navegador y todavía no existe un verificador/ruteador del lado del servidor. Solo rutas marcadas explícitamente como verificadas pueden generar alertas de desvío/llegada. Las coordenadas precisas se eliminan al completar/cancelar y vencen tras 24 h sin actualización por una tarea programada; producción necesita scheduler y proveedores/workers configurados. No se contacta automáticamente a autoridades ni sustituye servicios de emergencia. |
| 7 | Administración y analytics | Parcial | Dashboard agregado, gestión de cuentas, incidentes, catálogos e importación limitada de `stops.txt`/`routes.txt`. No importa horarios/calendarios GTFS completos. |
| 8 | Confiabilidad y reputación | Completado dentro del alcance actual | Valoraciones limitadas a participantes de viajes completados y reportes moderables. No equivale a investigación de identidad ni certificación independiente. |
| 9 | Pago y seguro | Parcial | Membresía de prueba, solicitudes de cotización y revisión manual de pólizas. Wompi está restringido a sandbox; `payments_enabled` es `false`; no se cobran pagos ni se activa cobertura automáticamente. |
| 10 | Dashboard, historial y comunicación | Parcial | Dashboard muestra métricas, actividad, historial con fechas y próximos viajes activos como responsable o pasajero aceptado; chat persistente entre participantes autorizados. Los mensajes se deduplican y ordenan, se conserva lo recién enviado frente a respuestas de sondeo atrasadas, se limpia el borrador al cambiar de viaje y se ignoran respuestas tardías de otra conversación. El sondeo inicial carga hasta 100 mensajes y luego consulta por ID incremental. No hay chat en tiempo real ni notificaciones push; la interfaz consulta cada 12 segundos mientras la pestaña está visible y actualiza al volver. |
| 11 | Privacidad y seguridad backend | Parcial | Cookies Sanctum/CSRF, validación, roles, límites de solicitudes y controles de ubicación. La preferencia de privacidad del perfil se guarda mediante API y se conserva localmente con valores permitidos. La exportación autenticada incluye cuenta, perfil, actividad, categorías/estados de denuncias, seguros, pagos, check-ins, historial de entrega de avisos y puntos GPS asociados al usuario autenticado, además de coordenadas de alertas SOS propias; está disponible también para cuentas pendientes o bloqueadas. Se excluyen contenido de denuncias, datos identificables de terceros, destinatarios, documentos de póliza, notas de revisión e identificadores internos del proveedor. No procesa solicitudes de borrado ni efectúa cobros. La ubicación disponible depende del scheduler y de la retención. No hay evidencia de certificación o pentest independiente. |
| 12 | Notificaciones y recordatorios | Parcial | Recordatorio local del navegador para viajes que salen en 30 minutos, con permiso explícito, deduplicación local y mensaje sin ruta/ubicación; solo funciona mientras ViajaU está abierta. Las demás preferencias se guardan localmente y no programan entrega. Push, correo, SMS/WhatsApp dependen de credenciales, consentimiento, colas y scheduler. |
| 13 | Funcionalidades avanzadas | Pendiente | Varias funciones —calendario universitario, predicción de patrones, hotspots y recomendaciones avanzadas— permanecen como inventario o ideas, no como servicios verificados. |
| 14 | Infraestructura y backend | Parcial | API Laravel, migraciones, jobs, scheduler y workflows CI presentes; se añadió Compose opcional para ruteo OSRM local. No hay evidencia de infraestructura de producción, backups operativos, SLO o monitoreo externo desplegado. |
| 15 | Checklist de cumplimiento | Pendiente | El checklist de interfaz es contenido de producto, no prueba de cumplimiento legal, auditoría externa ni certificación. |
| 16 | Roadmap | Pendiente | Es material de planificación; fases o porcentajes mostrados por la interfaz no demuestran entrega técnica. |

## 2. Descripción general

ViajaU es una aplicación web orientada a conectar estudiantes universitarios de Cali para consultar coincidencias de viaje y coordinar ofertas, solicitudes, trayectos y mecanismos de seguridad. El frontend es una SPA React servida por Vite; el backend es una API Laravel con autenticación Sanctum, persistencia relacional y rutas protegidas por autenticación, estado de cuenta, verificación de correo y rol.

La aplicación combina:

- Perfiles vinculados a una universidad y a un dominio institucional configurado.
- Ofertas de viaje, solicitudes de cupo, aceptación/rechazo y estados del trayecto.
- Búsqueda y recomendaciones con datos declarados de zona, hora/jornada y transporte.
- Rutas de terceros y cartografía OpenStreetMap; consulta de datos públicos de Metro Cali.
- SOS, ubicación compartida con consentimiento, check-ins, alertas, reputación, reportes y administración.
- Cotización y revisión manual de seguros; checkout exclusivamente sandbox para Wompi.

La interfaz consume la base definida por `VITE_API_URL` (por defecto `/api`) y solicita CSRF bajo la raíz del backend. En desarrollo Vite proxya `/api` y `/sanctum` al destino de `API_PROXY_TARGET` (por defecto `http://127.0.0.1:8000`). Para despliegue same-origin, enruta ambas rutas al mismo backend; para una API absoluta, configura CORS, cookies Sanctum, HTTPS y dominios stateful exactos. Las sesiones del navegador usan cookies de sesión Sanctum y protección CSRF; el backend también permite Personal Access Tokens a clientes API sin sesión. No se debe interpretar el contenido estático de demostración, una cifra de dashboard ni el inventario de funcionalidades como un dato operativo o una garantía de seguridad.

## 3. Stack tecnológico y dependencias

### Lenguajes y runtimes

| Tecnología | Restricción/versión declarada | Versión bloqueada u observada |
|---|---|---|
| PHP | `^8.3` en `backend/composer.json` | CI: PHP 8.4; entorno auditado: PHP 8.5.6 sin driver SQLite |
| Node.js | No se declara `engines` en `package.json` | CI: Node 22; entorno auditado: Node 24.15.0 |
| npm | No se declara versión mínima | Entorno auditado: npm 11.12.1; `package-lock.json` lockfile v3 |
| Composer | Composer 2 recomendado por el flujo | Entorno auditado: Composer 2.9.7 |
| JavaScript/JSX | Código frontend principal | ES modules; React 19 |
| TypeScript/TSX | `tsconfig.json` permite JS/TS; existe un componente `.tsx` | `allowJs: true`, `strict: false`; TypeScript no está declarado como dependencia directa de la raíz y no hay typecheck como gate de CI |

Las versiones locales son solo observaciones de la auditoría; el proyecto no fija la versión de Node/npm en un archivo `.nvmrc`, Volta, `engines` o equivalente. La CI fija la línea mayor Node 22.

### Frameworks y dependencias directas

El manifiesto define rangos `^`; la columna “resuelta” refleja los lockfiles del checkout, no una promesa de que esos rangos no cambien al actualizar el lockfile.

| Área | Dependencias principales | Declarada | Resuelta |
|---|---|---|---|
| Cliente | React / React DOM | `^19.3.1` | `19.3.1` |
| Build | Vite / `@vitejs/plugin-react` | `^8.3.4` / `^6.1.2` | `8.3.4` / `6.1.2` |
| Pruebas/lint | Vitest / Oxlint / Testing Library / jsdom | `^5.0.5` / `^1.88.0` / `^16.3.3` / `^30.1.3` | `5.0.5` / `1.89.0` / `16.3.3` / `30.1.3` |
| Dev build/tipos | `@tailwindcss/postcss` / `@types/react` / `@types/react-dom` | `^4.3.3` / `^19.3.0` / `^19.3.0` | `4.3.3` / `19.3.0` / `19.3.0` |
| HTTP | Axios | `^1.20.0` | `1.20.0` |
| Mapa/rutas | Leaflet | `^1.9.4` | `1.9.4` |
| UI | Chakra UI / MUI / React Bootstrap / Bootstrap / Emotion React / Emotion Styled | `^3.37.0` / `^9.5.0` / `^2.10.10` / `^5.3.8` / `^11.14.0` / `^11.14.1` | `3.37.0` / `9.5.0` / `2.10.10` / `5.3.8` / `11.14.0` / `11.14.1` |
| Estilos/utilidades | Tailwind CSS / PostCSS / Autoprefixer / `tailwind-merge` / `clsx` | `^4.3.3` / `^8.5.31` / `^10.6.1` / `^3.7.0` / `^2.1.1` | mismas versiones declaradas |
| Iconos/animación | Lucide React / React Icons / Framer Motion | `^1.59.0` / `^5.7.0` / `^14.4.0` | mismas versiones declaradas |
| Backend | Laravel / Sanctum / Tinker | `^13.17` / `^4.3` / `^3.0` | `13.37.0` / `4.3.3` / `3.0.2` |
| Calidad backend | PHPUnit / Pint / Faker / Mockery / Pail / Pao / Collision | `^12.5.12` / `^1.27` / `^1.23` / `^1.6` / `^1.2.5` / `^1.0.6` / `^8.6` | `12.5.40` / `1.32.1` / `1.24.1` / `1.6.15` / `1.2.7` / `1.1.5` / `8.9.5` |

La raíz contiene 19 dependencias runtime y 9 de desarrollo. `react-bits-main/` es una aplicación independiente con 44 dependencias runtime y 17 de desarrollo, manifiesto y lockfile propios; su stack incluye React `19.1.1`, Vite `5.4.21`, TypeScript `5.9.2`, Three.js y herramientas de documentación/generación. No es el runtime de ViajaU y tiene workflow CI separado. `backend/package.json` también conserva scripts/manifiesto Laravel/Vite, pero no tiene `backend/package-lock.json`; el frontend del producto se instala desde la raíz.

### Persistencia e infraestructura

- Base relacional Laravel/Eloquent. El valor por defecto de configuración es SQLite; `config/database.php` define conexiones SQLite, MySQL, PostgreSQL y SQL Server. La compatibilidad de cada migración con un motor de producción concreto no se considera validada por usar SQLite en CI.
- Las pruebas Laravel configuran SQLite `:memory:` y requieren `pdo_sqlite` y `sqlite3`.
- Documentos de póliza se gestionan mediante el filesystem privado configurado por Laravel; la descarga está restringida a administración.
- Jobs/colas y scheduler se usan para notificaciones de seguridad y vigilancia de check-ins. Requieren worker y tarea programada operativos.
- CI: GitHub Actions con workflows `Product CI` y `React Bits CI`.
- No hay `Dockerfile` ni manifiesto de despliegue general; `compose.osrm.yml` solo permite levantar ruteo local opcional. No se documenta una infraestructura de producción reproducible.
- Proveedores externos configurables: OSRM/OpenStreetMap, Nominatim, servicio público ArcGIS/GTFS de Metro Cali, Wompi sandbox y, si se configuran, SMTP/Twilio. Sus límites, disponibilidad y políticas dependen de terceros; OSRM/Nominatim pueden apuntarse a instancias autoalojadas.

## 4. Estructura del repositorio

```text
.
├── .github/workflows/       # CI independiente para producto y React Bits
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/  # controladores REST por dominio
│   │   ├── Models/                # modelos Eloquent
│   │   └── Services/              # búsqueda, analítica, notificaciones,
│   │                              # importación GTFS y contactos confiables
│   ├── bootstrap/                 # arranque/middleware Laravel
│   ├── config/                    # configuración Laravel y ViajaU
│   ├── database/
│   │   ├── migrations/            # esquema/versionado (27 archivos)
│   │   ├── factories/
│   │   └── seeders/
│   ├── routes/                    # routes/api.php y routes/web.php
│   ├── storage/                   # almacenamiento/logs Laravel
│   ├── tests/Feature/             # pruebas HTTP/funcionales
│   ├── tests/Unit/                # pruebas unitarias backend
│   ├── .env.example               # plantilla backend; sin credenciales reales
│   ├── composer.json / lock       # dependencias y versiones PHP
│   └── phpunit.xml                # PHPUnit; SQLite en memoria
├── public/                  # assets servidos por Vite
├── react-bits-main/         # aplicación independiente, catálogo React Bits
├── scripts/
│   ├── test-routing-api.js  # pruebas de contratos del cliente/routing
│   └── test-viajau-functions.js # script auxiliar no integrado a npm/CI
├── src/
│   ├── assets/              # recursos frontend
│   ├── components/          # pantallas y componentes; secciones/shell/ui
│   ├── config/              # catálogos/configuración de aplicación
│   ├── data/                # datos de presentación y mock data
│   ├── hooks/               # estado, acciones y efectos de dominio
│   ├── lib/                 # utilidades frontend
│   ├── services/            # API, routing, ubicación y lógica de dominio
│   ├── test/                # setup Vitest
│   ├── App.jsx / AppFresh.jsx / AppRoot.jsx
│   └── main.jsx             # punto de montaje React
├── package.json / lock      # frontend ViajaU
├── vite.config.js           # Vite, alias @ y proxy local API/Sanctum
├── vitest.config.js         # Vitest + jsdom
├── postcss.config.mjs       # Tailwind PostCSS y Autoprefixer
├── tsconfig.json            # resolución/type-check auxiliar; strict=false
├── .oxlintrc.json           # reglas Oxlint
├── README.md                # estado técnico mantenido
├── PROJECT_STATUS.md        # snapshot histórico, no fuente de verdad
└── ViajaU_Informe_con_Graficos.docx
```

### Componentes y servicios backend principales

- Controladores: `AuthController`, `ViajauController`, `TripSafetyController`, `SafetyAlertController`, `TravelMatchController`, `AdminManagementController`, `ReputationController`, `InsuranceController`, `MembershipController`, `WompiMembershipController` y `TripCommunicationController`.
- Servicios: `TravelOfferSearchService`, `DashboardAnalyticsService`, `SafetyNotificationService`, `TransitFeedImportService` y `TrustedContactProfileService`.
- Modelos representan usuarios/perfiles, ofertas/solicitudes/matches, ubicación/check-ins/eventos/alertas, contactos/entregas, reputación/reportes, catálogo/feed de tránsito, membresía/seguros y mensajes.
- Frontend: `AppFresh.jsx` reexporta `AppRoot.jsx`; `useAppState`, `useAppActions`, `useAppViewModel` y hooks de efectos/acciones dividen el orquestador. `viajauCore.js` reexporta solo los helpers de perfil, matching y viajes usados por la aplicación. Se retiraron los simuladores desconectados de alertas, seguridad, confianza, ubicación y riesgo, además de perfiles de demostración, muestras ficticias de viajes y puntuaciones artificiales de matching.

### Persistencia relacional observada

Las 27 migraciones crean o modifican estas tablas. Los nombres indican su propósito; el esquema exacto y las relaciones se definen en `backend/database/migrations/`.

| Tabla(s) | Responsabilidad |
|---|---|
| `users`, `student_profiles` | Cuenta/auth y perfil institucional asociado. |
| `travel_offers`, `trip_requests`, `trip_matches` | Ofertas, solicitudes de cupo y recomendaciones/matches persistidos. |
| `trip_locations`, `trip_check_ins`, `trip_safety_events`, `safety_alerts`, `safety_notification_deliveries` | Última ubicación, check-ins, eventos/geocercas, alertas SOS y entregas por canal. |
| `trip_reviews`, `user_reports`, `trust_ledgers` | Valoraciones, reportes y registro de reputación/confianza. |
| `trip_messages` | Mensajería persistente vinculada a viajes. |
| `institutional_catalog_entries` | Catálogos por universidad (sedes, facultades, programas y periodos). |
| `transit_feed_imports`, `transit_stops`, `transit_routes` | Importaciones y entidades limitadas de GTFS. |
| `insurance_enrollments`, `membership_payments` | Cotizaciones/pólizas y estados de transacción de membresía. |
| `personal_access_tokens`, `password_reset_tokens`, `sessions` | Infraestructura Sanctum, recuperación y sesión web. |
| `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs` | Caché, locks y colas Laravel. |

Las migraciones incluyen FKs con acciones explícitas, email único, perfil único por usuario, solicitud única por oferta/solicitante, ubicación única por viaje/usuario, check-in único por viaje/usuario/tipo y review único por viaje/autor/destinatario. También hay índices compuestos para búsquedas/actividad y restricciones de estados principales. Esto describe el esquema versionado, no certifica su comportamiento en todos los motores; las pruebas CI emplean SQLite.

### Configuración versionada revisada

`package.json` y `package-lock.json`, `backend/composer.json` y `backend/composer.lock`, `react-bits-main/package.json` y su lockfile, `vite.config.js`, `vitest.config.js`, `tsconfig.json`, `postcss.config.mjs`, `.oxlintrc.json`, `components.json`, `.github/workflows/*`, `backend/phpunit.xml`, `.gitignore` raíz y `backend/.gitignore`. `backend/.env.example` configura Laravel y `.env.example` en la raíz documenta proveedores frontend opcionales; ambos son plantillas sin secretos.

## 5. Requisitos previos e instalación

### Requisitos

1. Node.js 22.12 o superior como runtime de CI y `.nvmrc`; ambos manifiestos del producto declaran Node `>=22.12.0`. npm compatible con lockfile v3.
2. PHP `>=8.3` y Composer 2.
3. Extensiones PHP requeridas por el driver escogido; para pruebas locales, `pdo_sqlite` y `sqlite3`. En el entorno auditado los DLL existen, pero estaban deshabilitados.
4. Git y acceso de red a los proveedores externos si se prueban mapas, geocodificación, correo, SMS/WhatsApp o Wompi.
5. Docker Desktop con motor Linux activo, un extracto OSM que cubra Cali y espacio/RAM suficientes, solo si se quiere autoalojar OSRM. El tamaño y tiempo de procesamiento dependen del extracto y el equipo.
6. Para operación de avisos: SMTP, credenciales Twilio si se habilitan, worker de cola persistente y scheduler configurado. No son necesarios para compilar el frontend.

### Instalación local desde cero

Desde la raíz:

```sh
npm ci
npm run dev
```

El servidor de desarrollo escucha el puerto Vite por defecto y proxya `/api` y `/sanctum` al destino `API_PROXY_TARGET` (por defecto `http://127.0.0.1:8000`). Copia opcionalmente `.env.example` a `.env` en la raíz. Configura `VITE_API_URL` como `/api` para usar el proxy (o una ruta same-origin en despliegue) o como URL absoluta del endpoint API; `API_PROXY_TARGET` solo cambia el backend local del proxy y no sustituye la configuración CORS/Sanctum para peticiones cross-origin. Para iniciar Laravel, en otra terminal:

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

En PowerShell de Windows, usa `Copy-Item .env.example .env` en lugar de `cp`. Si se usa SQLite, configura `DB_DATABASE` al archivo local de base de datos y créalo antes de migrar. Para pruebas, verifica `php --ini`, habilita `extension=pdo_sqlite` y `extension=sqlite3` en el `php.ini` activo (y confirma que `extension_dir` apunta al directorio `ext` de PHP); luego verifica con `php -m` y ejecuta `php artisan test` desde `backend`. Si se usa otro motor, configura su driver/host/credenciales y verifica las migraciones contra ese motor antes de producción.

### Proveedores de mapas autoalojados (opcional)

Las URLs pueden configurarse en el `.env` de la raíz; al cambiarlas, reinicia Vite para que cargue los nuevos valores. Si quedan vacías, se conservan los proveedores públicos actuales. `VITE_OSRM_DRIVING_URL` sirve carro/taxi/moto; `VITE_OSRM_FOOT_URL` y `VITE_OSRM_BIKE_URL` admiten instancias OSRM independientes con perfiles apropiados; `VITE_NOMINATIM_URL` debe apuntar a una instancia Nominatim compatible. `VITE_MIO_GTFS_FEATURE_SERVICE` solo acepta una URL compatible con ArcGIS Feature Service; no convierte por sí sola los datos GTFS en horarios ni instala un servidor de tránsito.

Para preparar OSRM en Windows con Docker Desktop:

1. Desde PowerShell, descarga el extracto de Colombia desde Geofabrik. Python usa solo su biblioteca estándar y verifica tamaño y checksum antes de conservar el archivo:

   ```powershell
   py .\scripts\download-colombia-osm.py
   ```

   El archivo de unos cientos de MB y los grafos resultantes se ignoran en Git.
2. Prepara el grafo de conducción (el procesamiento puede tomar bastante tiempo y espacio):

   ```powershell
   .\scripts\prepare-osrm.ps1
   ```

   El script requiere exactamente un archivo `.osm.pbf`, usa el perfil de carro y prepara MLD; no descarga datos ni inicia contenedores persistentes.
3. Copia `.env.example` a `.env` en la raíz y ajusta `OSRM_DATASET_NAME` al nombre del archivo PBF sin `.osm.pbf`, además de `VITE_OSRM_DRIVING_URL=http://127.0.0.1:5000`.
4. Inicia el servicio local y verifica que responda:

   ```powershell
   docker compose --env-file .env -f compose.osrm.yml up -d
   Invoke-RestMethod "http://127.0.0.1:5000/route/v1/driving/-76.53,3.45;-76.52,3.46?overview=false"
   ```

   Para detenerlo: `docker compose --env-file .env -f compose.osrm.yml down`.

Este despliegue proporciona ruteo de conducción, no geocodificación ni mapas raster, y su capacidad depende del hardware y de actualizar el extracto OSM. Los datos OSM de Geofabrik se distribuyen bajo ODbL y requieren atribución visible (© OpenStreetMap contributors). Nominatim, perfiles peatonales/bicicleta y el servicio ArcGIS MIO no quedan instalados por este Compose. No se debe llamar “ilimitado”: autoalojar elimina la cuota del proveedor público, pero no los límites de capacidad, mantenimiento, cobertura y licencia.

La verificación de correo requiere configurar el mailer. Los avisos asíncronos requieren configurar cola, credenciales y worker; para la función programada, instala `php artisan schedule:run` en el scheduler del sistema. No uses credenciales de sandbox en producción ni habilites pagos reales: la configuración de producto los mantiene desactivados.

### Variables de entorno

Las variables de frontend se declaran en `.env.example`; las de backend, en `backend/.env.example`. Las tablas describen nombres y función; no publican secretos. Las variables de proveedores externos son opcionales para desarrollo básico.

| Variable frontend | Propósito |
|---|---|
| `VITE_OSRM_DRIVING_URL` | URL base OSRM para carro/taxi/moto; vacía usa el demo público. |
| `VITE_OSRM_FOOT_URL` | URL base de instancia con perfil peatonal; vacía usa el proveedor público de caminata. |
| `VITE_OSRM_BIKE_URL` | URL base de instancia con perfil bicicleta; vacía usa el proveedor público de bicicleta. |
| `VITE_NOMINATIM_URL` | URL base de geocodificación compatible con Nominatim; vacía usa el servicio público. |
| `VITE_MIO_GTFS_FEATURE_SERVICE` | URL base de ArcGIS Feature Service compatible; vacía usa el servicio público de Metro Cali. |
| `OSRM_DATASET_NAME` | Nombre base del extracto y grafo OSRM que monta `compose.osrm.yml`; debe coincidir con el `.osm.pbf`. |

| Variable | Propósito / requisito |
|---|---|
| `APP_NAME` | Nombre de la aplicación Laravel usado por configuración y mensajes. |
| `APP_ENV` | Entorno (`local`, `testing`, `production`); producción debe configurarse explícitamente. |
| `APP_KEY` | Clave de cifrado Laravel; generarla con `php artisan key:generate`, mantenerla secreta y estable. |
| `APP_DEBUG` | Detalle de errores; desactivarlo en producción. |
| `APP_URL` | URL base del backend. |
| `FRONTEND_URL` | URL usada en redirecciones de verificación/restablecimiento; debe apuntar al frontend correcto. |
| `APP_LOCALE` | Locale principal de Laravel. |
| `APP_FALLBACK_LOCALE` | Locale de respaldo. |
| `APP_FAKER_LOCALE` | Locale de datos Faker para factories. |
| `APP_MAINTENANCE_DRIVER` | Backend del modo mantenimiento. |
| `BCRYPT_ROUNDS` | Coste de hashing bcrypt. |
| `APP_PREVIOUS_KEYS` | Claves anteriores opcionales para rotación de cifrado; no está en la plantilla, pero Laravel la consume. |
| `LOG_CHANNEL` | Canal de logging principal. |
| `LOG_STACK` | Canales incluidos cuando se usa logging tipo stack. |
| `LOG_DEPRECATIONS_CHANNEL` | Canal para deprecaciones. |
| `LOG_LEVEL` | Severidad mínima de logs. |
| `DB_CONNECTION` | Driver por defecto; la configuración usa SQLite por defecto. |
| `DB_DATABASE` | Archivo SQLite o nombre de la base de datos. |
| `DB_URL` | URL de conexión opcional para drivers compatibles; no está en la plantilla. |
| `DB_HOST` | Host de MySQL/PostgreSQL/SQL Server; no está en la plantilla. |
| `DB_PORT` | Puerto del motor; no está en la plantilla. |
| `DB_USERNAME` | Usuario de base de datos; no está en la plantilla. |
| `DB_PASSWORD` | Contraseña de base de datos; no está en la plantilla. |
| `DB_FOREIGN_KEYS` | Habilita/deshabilita claves foráneas de SQLite; no está en la plantilla. Mantenerlas habilitadas salvo razón documentada. |
| `SESSION_DRIVER` | Almacenamiento de sesión; necesario para autenticación web Sanctum. |
| `SESSION_LIFETIME` | Duración de sesión en minutos. |
| `SESSION_ENCRYPT` | Cifrado del contenido de sesión. |
| `SESSION_PATH` | Path de la cookie de sesión. |
| `SESSION_DOMAIN` | Dominio de cookie, si frontend/API comparten subdominios. |
| `SESSION_SECURE_COOKIE` | Restringe cookie a HTTPS; activar en producción HTTPS. |
| `SESSION_HTTP_ONLY` | Evita acceso JavaScript a cookie de sesión; mantener activado. |
| `SESSION_SAME_SITE` | Política SameSite de cookie; alinear con el despliegue frontend/API. |
| `SESSION_PARTITIONED_COOKIE` | Opción Laravel para cookies particionadas; no está en la plantilla. |
| `SANCTUM_STATEFUL_DOMAINS` | Hosts exactos del frontend de primera parte; no incluir comodines sin revisar. |
| `SANCTUM_TOKEN_EXPIRATION` | Expiración en minutos para tokens API; la expiración de sesión web es independiente. |
| `CORS_ALLOWED_ORIGINS` | Orígenes frontend permitidos por CORS; no usar `*` junto con credenciales. |
| `BROADCAST_CONNECTION` | Driver de broadcasting. No implica que haya servicio realtime desplegado. |
| `QUEUE_CONNECTION` | Driver de jobs; debe coincidir con el worker/scheduler de operación. |
| `FILESYSTEM_DISK` | Disco Laravel para archivos; políticas deben permanecer en almacenamiento privado. |
| `CACHE_STORE` | Almacén de caché Laravel. |
| `MEMCACHED_HOST` | Host Memcached, si se selecciona ese store. |
| `REDIS_CLIENT` | Cliente Redis si se habilita Redis. |
| `REDIS_HOST` | Host Redis opcional. |
| `REDIS_PASSWORD` | Credencial Redis opcional; secreto. |
| `REDIS_PORT` | Puerto Redis opcional. |
| `MAIL_MAILER` | Mailer usado por Laravel para verificación y recuperación de cuenta. |
| `MAIL_SCHEME` | Esquema TLS del transporte de correo. |
| `MAIL_HOST` | Host SMTP. |
| `MAIL_PORT` | Puerto SMTP. |
| `MAIL_USERNAME` | Usuario SMTP; secreto según proveedor. |
| `MAIL_PASSWORD` | Contraseña SMTP; secreto. |
| `MAIL_FROM_ADDRESS` | Remitente de correo. |
| `MAIL_FROM_NAME` | Nombre visible del remitente. |
| `MAIL_URL` | URL SMTP opcional; consumida por Laravel pero no incluida en la plantilla. |
| `TWILIO_ACCOUNT_SID` | Cuenta Twilio para SMS/WhatsApp; secreto operacional. |
| `TWILIO_AUTH_TOKEN` | Token Twilio; secreto. |
| `TWILIO_FROM` | Número remitente SMS habilitado por Twilio. |
| `TWILIO_WHATSAPP_FROM` | Remitente WhatsApp aprobado/configurado. |
| `SAFETY_ROUTE_CORRIDOR_METERS` | Umbral de desvío de ruta; default de código: 500 m. |
| `SAFETY_ARRIVAL_RADIUS_METERS` | Radio de geocerca de llegada; default: 300 m. |
| `SAFETY_CHECKIN_GRACE_MINUTES` | Margen antes de alertar check-in vencido; default: 15 min. |
| `SAFETY_LOCATION_RETENTION_HOURS` | Tiempo máximo sin actualización antes de borrar coordenadas precisas; default: 24 h (mínimo efectivo: 1 h). Requiere que el scheduler de Laravel esté activo. |
| `INSURANCE_MONTHLY_BUDGET_COP` | Presupuesto mensual mostrado/configurado para cotizaciones; revisar legal/comercialmente antes de publicarlo como producto real. |
| `WOMPI_SANDBOX_ENABLED` | Habilita checkout de prueba; por defecto pagos reales están desactivados. |
| `WOMPI_SANDBOX_PUBLIC_KEY` | Llave pública de sandbox de Wompi. |
| `WOMPI_SANDBOX_INTEGRITY_SECRET` | Secreto sandbox para firma de integridad; secreto. |
| `WOMPI_SANDBOX_EVENTS_SECRET` | Secreto para verificar eventos webhook sandbox; secreto. |
| `AWS_ACCESS_KEY_ID` | Credencial AWS opcional si se configura almacenamiento S3. |
| `AWS_SECRET_ACCESS_KEY` | Secreto AWS opcional. |
| `AWS_DEFAULT_REGION` | Región S3 opcional. |
| `AWS_BUCKET` | Bucket S3 opcional. |
| `AWS_USE_PATH_STYLE_ENDPOINT` | Modo de endpoint S3 opcional. |
| `VITE_APP_NAME` | Variable frontend de plantilla; no se identifica una configuración Vite de URL API por entorno. |

Laravel consume además variables estándar del driver seleccionado (`DB_CHARSET`, `DB_COLLATION`, `DB_SOCKET`, parámetros PostgreSQL/SQL Server, opciones Redis, etc.) que no están todas en `.env.example`; verificar `backend/config/*.php` antes de cambiar de motor. No existe `.env.example` raíz. Mantener todos los secretos fuera del repositorio; el `.gitignore` de `backend/` ignora `.env`, pero la regla raíz para un eventual `.env` de frontend debe revisarse.

## 6. Ejecución y scripts disponibles

### Aplicación ViajaU (raíz)

| Comando | Uso |
|---|---|
| `npm ci` | Instala dependencias reproducibles desde `package-lock.json`. |
| `npm run dev` | Servidor local Vite; API/Sanctum proxyeados al backend local. |
| `npm run build` | Build de producción Vite; no ejecuta pruebas ni lint. |
| `npm run preview` | Sirve localmente el build generado. |
| `npm run test:unit` | Vitest sobre `src/**/*.test.{js,jsx}` con jsdom. |
| `npm run test:coverage` | Ejecuta Vitest con cobertura V8 y umbrales globales configurados. |
| `npm run test:routing` | Pruebas de contrato de routing/cliente API con Node y mocks. |
| `npm run lint` / `npm run lint:product` | Oxlint sobre `src/` con `--deny-warnings`. |
| `npm run lint:react-bits` | Ejecuta ESLint en el subproyecto `react-bits-main/`. |
| `node scripts/test-viajau-functions.js` | Diagnóstico exploratorio de 9 casos sin aserciones; captura errores y no falla el proceso, por lo que no sustituye pruebas ni se ejecuta en CI. |

No hay script de formato configurado en la raíz. `npm run lint:react-bits` ejecuta el lint del subproyecto aparte; no se debe confundir con lint del producto.

### Backend Laravel

Desde `backend/`:

| Comando | Uso |
|---|---|
| `composer install` | Instala dependencias PHP según `composer.lock`. |
| `php artisan key:generate` | Genera `APP_KEY`. |
| `php artisan migrate` | Aplica las 27 migraciones versionadas. |
| `php artisan serve` | Servidor de desarrollo Laravel. |
| `php artisan test` o `composer test` | Suite PHPUnit; necesita SQLite/PDO o la configuración de base de datos elegida. |
| `php artisan queue:work --queue=safety,default --tries=3 --timeout=30 --max-time=3600` | Worker de trabajos de notificación. |
| `php artisan schedule:run` | Ejecuta tareas programadas; en despliegue debe invocarse periódicamente desde el sistema. |

`composer.json` incluye scripts `setup`/`dev` heredados del esqueleto Laravel que también invocan npm; el producto tiene su propio `package.json` en raíz y el subproyecto Laravel incluye otro manifiesto sin lockfile. Para desarrollo local, ejecutar frontend y backend siguiendo los comandos separados anteriores y validar qué directorio usa cualquier script Composer antes de usarlo.

### Subproyecto `react-bits-main/`

Tiene scripts propios de `dev`, `build`, `lint`, `test:boot`, `test:prop-docs`, `test:seo` y `test:shape-magic`, además de herramientas de generación de documentación, registry, sitemap, RSS, imágenes y assets. Instalar con `npm ci` dentro del subdirectorio. El workflow `React Bits CI` ejecuta sus pruebas, build y lint; no es el conjunto de pruebas de ViajaU.

## 7. Mapa de API, endpoints y funcionalidades

Todas las rutas API Laravel usan el prefijo `/api`. `GET` también admite `HEAD` según el router. Los estados de esta tabla describen la existencia de la ruta/handler, no disponibilidad de proveedores ni operación de producción.

| Método | Ruta / componente | Descripción | Estado de implementación |
|---|---|---|---|
| `GET` | `/api/health` | Liveness del proceso; no consulta dependencias. | Implementado; responde aunque la base de datos no esté disponible. |
| `GET` | `/api/ready` | Readiness que ejecuta una consulta simple a la base de datos. | Implementado; devuelve `503` y registra el fallo sin exponer detalles de conexión. La sección de infraestructura consulta este endpoint al abrirse, permite reintentar y muestra el estado devuelto. |
| `POST` | `/api/register`, `/api/auth/register` | Registro institucional; límite 5/min. | Implementado; un fallo SMTP queda explícito en `verification_email_sent` y se puede reintentar por el endpoint de verificación. |
| `POST` | `/api/login`, `/api/auth/login` | Inicio de sesión; límite general 10/min y control adicional por credenciales/IP. | Implementado; sesión browser o token API según contexto. |
| `POST` | `/api/auth/forgot-password` | Solicita recuperación de contraseña; 5/min. | Implementado; requiere mailer. |
| `POST` | `/api/auth/reset-password` | Restablece contraseña con token por correo; 5/min. | Implementado; requiere mailer/token válido. |
| `POST` | `/api/payments/wompi/webhook` | Recibe evento `transaction.updated`; 120/min. | Sandbox; firma verificada, no activa membresías/pagos reales. |
| `GET` | `/api/user` | Devuelve usuario autenticado activo. | Implementado; Sanctum + `account.active`. |
| `POST` | `/api/logout`, `/api/auth/logout` | Cierra sesión o revoca token actual. | Implementado; Sanctum. |
| `GET` | `/api/me`, `/api/auth/me` | Devuelve cuenta actual. | Implementado; Sanctum. |
| `GET` | `/api/account/export` | Exporta cuenta, perfil, actividad, denuncias, seguros, pagos, check-ins y puntos GPS propios en JSON; 6/min. | Implementado; requiere cuenta activa y Sanctum; respuesta `no-store`. Omite identificadores de terceros, documentos de póliza, notas de revisión e identificadores internos de pago. Los montos no confirman cobros; la exportación no procesa solicitudes de borrado. |
| `POST` | `/api/auth/email/verification-notification` | Envía/reintenta correo de verificación; 6/min. | Implementado; devuelve `503` si el transporte SMTP falla para que el cliente pueda reintentar. |
| `PUT` | `/api/profile`, `/api/auth/profile` | Actualiza perfil de la cuenta. | Implementado; Sanctum + cuenta activa. |
| `POST` | `/api/profile/photo` | Sube foto de perfil mediante `AuthController::updateProfile`. | Implementada; acepta JPG/JPEG/PNG/WebP hasta 2 MB y la almacena en el disco `public`. |
| `PUT` | `/api/auth/change-password` | Cambia contraseña; límite 5/min. | Implementado; requiere cuenta autenticada. |
| `GET` | `/api/students/{id}` | Consulta perfil de estudiante. | Implementado; Sanctum + cuenta activa. |
| `PUT` | `/api/students/{id}/profile` | Actualiza perfil institucional. | Implementado; Sanctum + cuenta activa. |
| `GET` | `/api/membership` | Estado/fechas de membresía. | Implementado; no implica cobro activo. |
| `POST` | `/api/membership/wompi/checkout` | Genera checkout de prueba; 5/min. | Sandbox, pagos desactivados. |
| `GET` | `/api/insurance/products` | Lista productos candidatos de seguro. | Implementado; condiciones/precios requieren proveedor. |
| `GET` | `/api/insurance/enrollments/mine` | Solicitudes/pólizas del estudiante autenticado. | Implementado. |
| `POST` | `/api/insurance/enrollments` | Solicita cotización; 5/min. | Implementado; no activa cobertura. |
| `POST` | `/api/insurance/enrollments/{enrollment}/policy` | Envía documento para revisión; 5/min. | Implementado; revisión administrativa manual. |
| `GET` | `/api/communication/trips` | Lista viajes donde el usuario puede comunicarse. | Implementado para participantes autorizados. |
| `GET` | `/api/trips/{trip}/messages` | Lee los últimos 100 mensajes; `since_id` pagina mensajes nuevos y `before_id` carga los 100 anteriores. Los cursores son excluyentes. | Implementado; `meta.has_older` indica si queda historial, con autorización por participación y respuestas `no-store`. |
| `POST` | `/api/trips/{trip}/messages` | Envía mensaje; 30/min. | Implementado; no realtime, longitud limitada en backend y respuesta `no-store`. |
| `GET` | `/api/reputation/me` | Resumen de reputación propia. | Implementado para cuenta verificada. |
| `GET` | `/api/reputation/profiles/{profile}` | Consulta perfil agregado de reputación. | Implementado; visibilidad limitada por reglas del dominio. |
| `POST` | `/api/trips/{trip}/reviews` | Califica participante; 10/min. | Implementado tras viaje completado y con participación validada. |
| `POST` | `/api/trips/{trip}/reports` | Reporta participante; 5/min. | Implementado; reporte privado/moderable. |
| `GET` | `/api/trips` | Busca ofertas con filtros opcionales `zone`, `time`, `faculty`, `university`, `transport`, `date_from` y `date_to`; `after_id` pagina resultados. | Implementado; requiere Sanctum, cuenta activa y correo verificado. Solo retorna ofertas futuras de estudiantes activos/verificados, sin correo ni contacto privado. |
| `POST` | `/api/trips` | Publica oferta; 10/min. | Implementado; validación y reglas de negocio backend. |
| `GET` | `/api/trips/mine` | Ofertas y solicitudes propias; `offers_before_id` y `requests_before_id` paginan cada historial de forma independiente. | Implementado; lotes de hasta 100, cursor descendente estable y respuestas limitadas al perfil autenticado. |
| `POST` | `/api/trips/{trip}/requests` | Solicita cupo; 10/min. | Implementado; estado y cupos coordinados por backend. |
| `PATCH` | `/api/trips/{trip}` | Transición/cancelación de oferta según reglas del controlador. | Implementado con restricciones de estado/participación. |
| `PATCH` | `/api/trip-requests/{tripRequest}` | Acepta, rechaza o actualiza solicitud. | Implementado; límite 20/min. |
| `GET` | `/api/matches` | Calcula coincidencias verificadas; `after_id` pagina ofertas evaluadas. | Implementado; el cliente fusiona páginas sin duplicados y reordena globalmente por puntaje. Pondera zona (50), jornada (35) y transporte (15); el puntaje no mide seguridad. |
| `POST` | `/api/alerts` | Crea alerta SOS; 3/min. | Implementado; GPS solo si se solicita/consiente. |
| `POST` | `/api/trips/{trip}/location` | Actualiza ubicación consentida; 30/min. | Implementado solo en viaje en curso y participante autorizado. |
| `DELETE` | `/api/trips/{trip}/location` | Retira ubicación compartida. | Implementado. |
| `GET` | `/api/trips/{trip}/safety` | Estado de seguridad y ubicación actual del viaje. | Implementado para participante y viaje en curso. |
| `POST` | `/api/trips/{trip}/check-ins` | Registra check-in; 10/min. | Implementado; requiere viaje/participante elegible. |
| `GET` | `/api/dashboard` | Métricas administrativas agregadas. | Implementado para roles `admin`/`university` verificados; alcance institucional. |
| `GET` | `/api/admin/users` | Lista/filtra usuarios administrables. | Implementado para `admin`/`university`, con límites por institución. |
| `PATCH` | `/api/admin/users/{managedUser}` | Gestiona estado/verificación de cuenta. | Implementado; no permite elevar roles mediante registro público. |
| `GET` | `/api/admin/incidents` | Lista incidentes/alertas administrativas. | Implementado con datos limitados. |
| `GET` | `/api/admin/catalog` | Consulta catálogo institucional. | Implementado para `admin`/`university`. |
| `POST` | `/api/admin/catalog` | Crea entrada de catálogo. | Implementado con validación/alcance institucional. |
| `PATCH` | `/api/admin/catalog/{entry}` | Actualiza entrada. | Implementado. |
| `DELETE` | `/api/admin/catalog/{entry}` | Desactiva entrada de catálogo. | Implementado como baja lógica según servicio. |
| `GET` | `/api/admin/insurance/enrollments` | Lista solicitudes de seguro. | Implementado; rol `admin`. |
| `PATCH` | `/api/admin/insurance/enrollments/{enrollment}` | Cotiza/modera/actualiza enrolamiento. | Implementado; revisión humana necesaria. |
| `GET` | `/api/admin/insurance/enrollments/{enrollment}/document` | Descarga documento de póliza. | Implementado; acceso restringido a admin. |
| `GET` | `/api/admin/reports` | Lista reportes de reputación. | Implementado; rol `admin`. |
| `PATCH` | `/api/admin/reports/{report}` | Modera reporte. | Implementado; rol `admin`. |
| `POST` | `/api/admin/transit-feed/import` | Importa snapshots `stops.txt`/`routes.txt`; 3/min. | Implementado con validación; no importa calendario/`stop_times`. |
| `GET` | `/api/admin/transit-feed/latest` | Consulta último feed importado. | Implementado; rol `admin`. |
| `GET` | `/api/security/alerts` | Lista alertas para seguridad. | Implementado para `security`/`admin` verificados. |
| `PATCH` | `/api/security/alerts/{alert}/resolve` | Marca alerta atendida. | Implementado con usuario y timestamp. |

Las rutas alias antiguas de auth (`/api/register`, `/api/login`, `/api/logout`, `/api/me`, `/api/profile`) permanecen por compatibilidad. Todas las rutas funcionales se declaran en `backend/routes/api.php`; `php artisan route:list --path=api` mostró 62 registros incluyendo aliases y `HEAD`.

### Rutas web Laravel

| Método | Ruta | Función | Estado |
|---|---|---|---|
| `GET` | `/` | Vista Laravel `welcome`. | Implementada; el frontend de producto se sirve por Vite de forma separada. |
| `GET` | `/auth/verify-email/{id}/{hash}` | Verificación firmada de correo. | Implementada; depende de enlace y correo válidos. |
| `GET` | `/reset-password/{token}` | Redirige a `FRONTEND_URL` con token/correo de recuperación. | Implementada; configurar URL segura correcta. |

### Servicios de interfaz que no son endpoints ViajaU

| Servicio | Uso | Límite |
|---|---|---|
| OSRM público / OpenStreetMap Routing | Rutas para carro/taxi, caminata y bicicleta. | Los endpoints se pueden reemplazar por servicios autoalojados. El demo público no tiene SLA; moto reutiliza ruta vial genérica. |
| Nominatim | Búsqueda de direcciones. | Endpoint configurable; Nominatim público tiene política de uso y límites, no es una API ilimitada. |
| ArcGIS Feature Service de Metro Cali | Consulta de paradas y geometrías de rutas. | No proporciona calendario activo confirmado en esta integración. |
| Wompi checkout widget | UI de pago sandbox. | No procesa pagos de producción ni activa membresía. |
| Geolocation API del navegador | Ubicación solicitada por acción explícita. | Requiere permiso/contexto seguro; las coordenadas se transmiten al solicitar funciones dependientes. |

## 8. Deuda técnica y puntos de mejora observados

1. **Cobertura frontend todavía baja.** Vitest mide 9,30 % de líneas en la última ejecución observada y sus umbrales actuales son pisos mínimos de no regresión. PHPUnit no genera reporte porcentual; ampliar cobertura de flujos críticos y medir el backend por separado.
2. **Pruebas backend y entorno local.** La suite requiere PHP `^8.3` y `pdo_sqlite`; el PHP incluido con XAMPP (8.2) no satisface el requisito y el PHP 8.5 del entorno auditado necesita habilitar SQLite explícitamente. En CI debe conservarse la validación de dependencias; PHPUnit usa SQLite en memoria y no debe apuntarse a MySQL de XAMPP.
3. **Checklist de cumplimiento manual.** La interfaz ya no presenta porcentajes ni certificaciones de producción; los estados editables del checklist son anotaciones locales y no miden cobertura, readiness ni disponibilidad.
4. **Mocks/datos de demostración presentes.** `src/data/mockData.js` contiene perfiles, ofertas, notificaciones, incidentes y datos de informe estáticos. Separar fixtures de pantallas operativas y mantenerlos rotulados para evitar confundirlos con información real.
5. **Componentes y hojas de estilo extensos.** Permanecen archivos grandes, entre ellos `mockData.js`, `App.css`, `index.css`, `InteractiveMap.jsx`, `AcademicReportViewer.jsx`, `authApi.js` y `TripExplorer.jsx`; evaluar su separación por responsabilidad sin alterar contratos públicos.
6. **Fechas históricas de ofertas.** Las ofertas existentes con `departure_date = NULL` se conservan, pero quedan excluidas de búsqueda y recomendaciones; definir si se migran con fechas confirmadas o se archivan, sin inventar fechas.
7. **Topología API/Sanctum depende del despliegue.** `VITE_API_URL` y `API_PROXY_TARGET` permiten definir el endpoint de cliente y el proxy local; configurar y probar CORS, HTTPS, cookies, CSRF y dominios stateful para cada topología real.
8. **Protección de secretos en raíz.** El `.gitignore` raíz ahora excluye `.env` y `.env.*` sin excluir plantillas `*.example`; `backend/.gitignore` también protege el entorno de Laravel. Verificar que los archivos de entorno locales no se añadan al índice.
9. **Persistencia de sesión y despliegue requieren configuración explícita.** Definir `SANCTUM_STATEFUL_DOMAINS`, CORS exacto, HTTPS, `SESSION_SECURE_COOKIE`, dominio/SameSite y CSRF por topología; no validar solo en localhost.
10. **Integraciones de seguridad no equivalen a respuesta de emergencia.** Email/SMS/WhatsApp son best-effort y dependen de consentimiento, credenciales y cola/scheduler. Los fallos de transporte de verificación de correo ahora son visibles y reintentables; faltan pruebas operativas de proveedores, observabilidad externa y protocolo humano de incidentes.
11. **Ubicación es dato sensible.** El backend mantiene solo la última coordenada por participante, la borra al completar/cancelar y expira coordenadas sin actualización después de 24 h mediante scheduler. Producción requiere verificar que el scheduler corra, y revisar permisos, almacenamiento, logs, copias, acceso administrativo, borrado y obligaciones locales de protección de datos.
12. **GTFS parcial y proveedor externo.** Importador acepta `stops.txt`/`routes.txt`, no viajes, `stop_times` ni calendarios; evitar presentar frecuencias u horarios activos. Añadir actualización, versionamiento y supervisión de fallos del feed.
13. **Pagos/seguros no son producción.** `payments_enabled=false`, Wompi sandbox y revisión manual; falta integración comercial/contractual, reconciliación, idempotencia de pagos reales y pruebas end-to-end con proveedor.
14. **Monolito de API frontend restante.** `authApi.js` concentra llamadas de varios dominios; dividirlo por dominio preservando el contrato público y centralizar manejo de sesión, errores, abortos y timeout.
15. **Configuración de TypeScript no verificada.** `strict: false`, `allowJs: true`; TypeScript no está declarado directamente en el package raíz y no existe gate de typecheck, aunque hay `tsconfig.json` y un archivo `.tsx`. Añadir dependencia/CI de forma explícita y migrar con chequeo estricto progresivo.
17. **Dependencias UI redundantes.** Conviven Chakra, MUI, Bootstrap/React Bootstrap, Radix y Tailwind. Revisar uso real, peso de bundle, consistencia visual y superficie de mantenimiento antes de añadir más librerías.
18. **Política de runtime Node atendida.** `.nvmrc` fija la línea 22, ambos manifiestos declaran `engines.node >=22.12.0` (mínimo requerido por Vite 8) y los lockfiles se sincronizaron. CI usa Node 22; las pruebas locales también deben seguir esa línea para reproducibilidad.
19. **Manifiesto frontend backend duplicado.** `backend/package.json` no tiene lockfile propio y Composer conserva scripts que llaman npm; documentar si es residual o integrarlo correctamente para evitar instalaciones/builds desde el directorio equivocado.
20. **Estructura de prueba reducida en frontend.** Hay ocho archivos Vitest y dieciséis pruebas en la última ejecución observada frente a múltiples servicios, hooks, estados y componentes; ampliar casos para errores, accesibilidad, autorización visual y estados de carrera.
21. **Script auxiliar sin aserciones.** `scripts/test-viajau-functions.js` imprime resultados de 9 casos, pero no compara valores esperados y captura errores sin propagar un código de salida fallido. No debe tratarse como prueba ni añadirse a CI hasta convertir sus casos en aserciones automatizadas.
22. **Compatibilidad SQL no demostrada fuera de SQLite.** El código configura varios motores, pero CI prueba SQLite. Confirmar índices, locks, constraints, transacciones y migraciones con el motor de producción elegido.
23. **Límites/uso de servicios públicos.** Nominatim, OSRM y ArcGIS son dependencias de terceros sin SLA del proyecto; se necesitan política de rate-limit/cache, fallback explícito, atribución y monitoreo.
24. **Documentación backend parcialmente heredada.** `backend/README.md` conserva contenido del esqueleto Laravel además de documentación ViajaU; consolidar instalación y comandos propios para reducir ambigüedad.
25. **No hay despliegue repetible versionado.** No se encontró Docker/Compose ni manifiesto de infraestructura. Incorporar despliegue, health checks, secretos, migraciones, workers, scheduler, almacenamiento privado, backups y procedimiento de rollback antes de producción.
26. **No inferir cumplimiento por el checklist.** Revisar privacidad, consentimiento, retención/borrado, términos, seguros, movilidad compartida y atención de incidentes con especialistas legales y operativos en cada jurisdicción.
27. **Memoria del build React Bits en entorno Windows.** La compilación completa no se pudo verificar localmente: Vite excedió el heap predeterminado de Node durante la transformación. Medir en CI y en una máquina con memoria disponible; no subir el límite de heap sin comprobar el consumo total y la capacidad del runner.
