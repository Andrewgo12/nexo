# Archivo histórico: estado del proyecto al 2026-10-20

Fecha de revisión: 2026-10-20

> Este documento conserva un snapshot histórico y no debe usarse para evaluar el estado actual ni para preparar despliegues. Sus porcentajes, dependencias pendientes y referencias a ramas/configuraciones pueden haber quedado obsoletos. [README.md](./README.md) es la fuente de verdad vigente y enlaza las pruebas, capacidades y dependencias operativas actuales.

## 1) Resumen ejecutivo

El proyecto ya no es sólo un prototipo de frontend: ahora cuenta con una base de backend real en Laravel y una base de datos MySQL local para persistencia de estudiantes, viajes, matches y alertas de seguridad.

La lógica de negocio del producto sigue validada y funcionando, y además la capa API ya está levantada con endpoints básicos para registrar estudiantes, crear viajes, listar matches y consultar el dashboard del sistema.

Estado real actualizado:
- Frontend/product prototype: 85–90%
- Lógica de negocio funcional: 90–95%
- Backend real y persistencia: 60–70%
- Producción real: 0%

## 2) Estado de compilación y runtime

Comando ejecutado:
```bash
npm run build
```

Resultado real:
```text
vite v8.3.4 building client environment for production...
✓ built in 2.52s
```

Conclusión: la app compila correctamente en producción.

### Backend API local

Comando ejecutado:
```bash
curl.exe -sS http://127.0.0.1:8000/api/health
```

Resultado real:
```json
{"status":"ok","app":"ViajaU","mode":"backend-foundation","moment":"2026-10-20T05:03:25.239835Z"}
```

La API de Laravel responde correctamente con la base de datos MySQL local conectada.

## 3) Estado de pruebas de funciones

Comando ejecutado:
```bash
node scripts/test-viajau-functions.js
```

Resultado real:
```text
===== VIAJAU PROJECT FUNCTION TEST SUITE =====
Timestamp: 2026-10-20T04:50:09.349Z

✔ UNIVERSITY_DOMAINS: {...}
✔ validateInstitutionalEmail: true
✔ createStudentProfile: {...}
✔ calculateDistanceBetweenPoints: 2.55
✔ buildRouteSummary: {...}
✔ calculateCompatibilityScore: 99
✔ filterTravelMatches: [...]
✔ createTravelOffer: {...}
✔ requestTripSeat: [...]
✔ calculateTripCost: {...}
✔ createEmergencyAlert: {...}
✔ updateTravelStatus: [...]
✔ createChatMessage: {...}
✔ buildTravelSearchCandidates: [...]
✔ buildSafetyOverview: {...}
✔ buildDashboardSnapshot: {...}
✔ buildMatchRecommendations: [...]
✔ computeReputationScore: 4.8
✔ rateUser: {...}
✔ reportUser: {...}
✔ generateNotification: {...}
✔ createTripGroup: {...}
✔ getUserSummary: {...}
✔ challengeRequiredActions: [...]
✔ getRouteModeKey: "walk"
✔ createTrustLedger: {...}
✔ getCurrentStudentLocation: {...}
✔ searchZoneByText: [...]
✔ suggestMeetingPoint: {...}
✔ evaluateTripRisk: {...}
✔ createModerationCase: {...}
✔ buildTrustSummary: {...}
✔ buildSafetyAlert: {...}
✔ getOsrmRoute: {...}
✔ searchAddressNominatim: {...}
✔ calculateMultimodalDetails: [...]
✔ readAppData/writeAppData: {...}
✔ resetAppData: {...}

===== SUMMARY =====
Tests run: 41
Passed: 41
Failed: 0
```

## 4) Funciones actuales implementadas

### 4.1 Lógica de negocio central (`src/services/viajauCore.js`)

- `UNIVERSITY_DOMAINS`
- `validateInstitutionalEmail(email, domain)`
- `createStudentProfile(data)`
- `calculateDistanceBetweenPoints(origin, destination)`
- `buildRouteSummary({ origin, destination, mode, routeResult })`
- `calculateCompatibilityScore(student, trip)`
- `filterTravelMatches(searchState, candidates)`
- `createTravelOffer(student, route)`
- `requestTripSeat(trips, index)`
- `calculateTripCost(distanceKm)`
- `createEmergencyAlert(type, studentName)`
- `updateTravelStatus(trips, index, status)`
- `createChatMessage(sender, text)`
- `buildTravelSearchCandidates()`
- `buildSafetyOverview(student)`
- `buildDashboardSnapshot(trips, alerts)`
- `buildMatchRecommendations(student, candidates)`
- `computeReputationScore(reviews)`
- `rateUser(user, score)`
- `reportUser(user, reason)`
- `generateNotification(type, message, channel)`
- `createTripGroup(student, route)`
- `getUserSummary(student)`
- `challengeRequiredActions()`
- `getRouteModeKey(mode)`
- `createTrustLedger(user, eventName, scoreDelta)`
- `getCurrentStudentLocation(student)`
- `searchZoneByText(query, zones)`
- `suggestMeetingPoint(origin, destination, zones)`
- `evaluateTripRisk(trip, student)`
- `createModerationCase(user, reason)`
- `buildTrustSummary(users)`
- `buildSafetyAlert(type, message, severity)`

### 4.2 API / routing (`src/services/routingApi.js`)

- `getOsrmRoute(origin, dest, mode)`
- `searchAddressNominatim(query)`
- `calculateMultimodalDetails(distanceKm)`

### 4.3 Persistencia local (`src/services/appDatabase.js`)

- `readAppData()`
- `writeAppData(payload)`
- `resetAppData()`

### 4.4 Backend real (`backend/`)

- `student_profiles`
- `travel_offers`
- `trip_matches`
- `safety_alerts`
- `trust_ledgers`
- `GET /api/health`
- `POST /api/students/register`
- `GET /api/trips`
- `POST /api/trips`
- `GET /api/matches`
- `POST /api/matches`
- `POST /api/alerts`
- `GET /api/dashboard`

## 5) Módulos con cobertura real del producto

### Completados funcionalmente

- Usuarios y validación institucional
- Perfiles y seguridad
- Geolocalización y rutas
- Búsqueda por filtros y ordenamiento
- Matching por zona y horario
- Gestión de viajes
- Seguridad y geocerca
- Reputación/trust
- Alertas y notificaciones
- Cobertura / seguros básicos
- Dashboard de producto

### Pendientes para producción real

- Backend real con base de datos
- Autenticación real con JWT/session
- Roles y permisos por usuario
- Geolocalización en vivo del dispositivo
- RTDB / WebSockets para trazas en tiempo real
- GTFS real + integración OSM/OTP
- Pago real con gateway
- Moderación real y reportes persistentes
- Sistema de notificaciones push/email/SMS real
- Infraestructura de logs, monitoreo, caché y backup

## 6) Lo que le falta al proyecto para ser completo

La base funcional del producto ya existe; ahora lo que falta no es “más catálogo de funciones”, sino completar la capa real del sistema para que el producto deje de ser un prototipo:

1. Persistencia y auth real
   - registro/login/logout con usuarios reales
   - password hashing y sesiones
   - roles y permisos por universidad

2. Geolocalización en vivo
   - GPS del dispositivo
   - ubicación compartida en tiempo real
   - geocercas reales y alerts por desviación

3. Integración de mapas y transporte
   - GTFS real de MIO
   - OpenTripPlanner / OSRM reales
   - polyline y estaciones reales

4. Pagos y seguros
   - Stripe o Mercado Pago
   - cobertura por viaje y claims reales

5. Chat y notificaciones reales
   - sockets / WebSockets
   - push, SMS y email reales

6. Infraestructura de producción
   - logs, observabilidad, backups, rate limits, env vars, caché

## 7) Estado final real

La app está en un estado sólido de MVP funcional y validado, con lógica de negocio cercana a un producto real de movilidad universitaria. La parte visual y el flujo principal ya están construidos y funcionan.

Además, la base de backend quedó preparada con Laravel y MySQL local, con migraciones y API mínima operativa. Eso convierte al proyecto de un prototipo puramente frontend a una base real para continuar con la fase de autenticación, persistencia profesional y geolocalización en vivo.

## 8) Archivos relevantes

- `src/AppFresh.jsx`
- `src/services/viajauCore.js`
- `src/services/routingApi.js`
- `src/services/appDatabase.js`
- `scripts/test-viajau-functions.js`
- `scripts/viajau-function-test.log`

## 9) Comandos para repetir la validación

```bash
npm run build
node scripts/test-viajau-functions.js
```

## 10) Recomendación del siguiente paso

El siguiente paso correcto no es seguir llenando más funciones de catálogo, sino construir la capa de backend real para convertir este prototipo funcional en un producto real con persistencia, sesiones, geolocalización real y una infraestructura productiva.
