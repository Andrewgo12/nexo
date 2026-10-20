# ViajaU - Estado real del proyecto

Fecha de revisión: 2026-10-20
Rama: `agents/dominant-wallaby`
Repositorio: `Andrewgo12/nexo`

## 1) Resumen ejecutivo

El proyecto está en un estado de prototipo funcional avanzado, con la lógica principal de negocio ya implementada y validada. La aplicación ya cubre la mayor parte del valor del MVP: validación universitaria, perfiles, búsquedas por zona/horario, matching, gestión de viajes, seguridad, KPI y alertas.

Sin embargo, NO es todavía una versión de producción con backend real, autenticación real, base de datos persistente, geolocalización en vivo, pagos reales o integración con GTFS/OSRM/productividad real en producción.

Estado real:
- Frontend/product prototype: 85–90%
- Lógica de negocio funcional: 90%
- Backend real y persistencia: 0–10%
- Producción real: 0%

## 2) Estado de compilación

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
✔ calculateTravelReadiness: {...}
✔ buildDashboardMetrics: {...}
✔ createTrustLedger: {...}
✔ buildSafetyMatrix: {...}
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
- `calculateTravelReadiness(student, route)`
- `buildDashboardMetrics(student, route, tripCards, alertFeed)`
- `createTrustLedger(user, eventName, scoreDelta)`
- `buildSafetyMatrix(student)`
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

Este proyecto ya no está “vacío” ni “solo con UI”. Ya tiene una base sólida de producto. Pero para ser un sistema real, faltan estas capas:

1. Persistencia real
   - PostgreSQL/Supabase/Firebase
   - tablas: users, trips, match_requests, alerts, incidents, trust_scores

2. Auth real
   - registro completo
   - login/logout
   - restablecimiento de contraseña
   - validación de dominio con comprobación real

3. Geolocalización real
   - GPS del dispositivo
   - ubicación compartida en vivo
   - geocercas reales

4. Integración de mapas y transporte
   - GTFS real de MIO
   - OSRM/OTP real
   - polyline + estaciones + rutas en vivo

5. Pagos y seguros
   - Stripe/mercado pago
   - cobertura por viaje y claim real

6. Chat en tiempo real
   - sockets
   - mensajería segura por grupo de viaje

7. Infraestructura de producción
   - logs, observabilidad, backups, env vars, rate limits

## 7) Estado final real

La app está en un estado sólido de MVP funcional y validado, con una lógica de negocio muy cercana a un producto real de movilidad universitaria. La parte visual y el flujo principal ya están bien construidos y funcionan.

Pero todavía no es una versión 1.0 productiva. La brecha principal es la capa backend, datos reales y tiempo real.

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
