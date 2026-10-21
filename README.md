# ViajaU

Plataforma universitaria para compartir viajes con perfiles verificados, búsqueda por zonas, rutas y gestión de cupos. El producto se desarrolla en módulos secuenciales; la lista de funciones de la interfaz es un inventario de alcance, no evidencia de implementación por sí sola.

## Estado actual

| Módulo | Área | Estado |
|---|---|---|
| 1 | Autenticación y usuarios | Base funcional: registro institucional, verificación por correo, inicio/cierre de sesión, perfil, roles y protección de rutas. |
| 2 | Mapa, rutas y geolocalización | Parcial: OSRM/Nominatim, mapas OpenStreetMap y trazados/paradas públicas del MIO; sin horarios GTFS activos. |
| 3 | Búsqueda, filtros y ordenamiento | Parcial: ofertas activas con filtros sobre los datos disponibles y límites de privacidad. |
| 4 | Emparejamiento por zona y horario | Implementado para ofertas verificadas; afinidad explicable, no reputación ni evaluación de seguridad. |
| 5 | Gestión de viajes | Implementado: publicar ofertas, pedir/aceptar cupos, evitar sobreventa, cancelar, iniciar y completar. |
| 6 | Seguridad y ubicación del viaje | Parcial: SOS, GPS consentido, geocercas y avisos opt-in; requiere SMTP/Twilio y cola configurados. No integra autoridades ni servicios de emergencia. |
| 7 | Administración y analytics | Implementado: métricas agregadas, gestión institucional de cuentas/verificaciones, incidentes, catálogos e importación validada de paradas/rutas GTFS. |
| 8 | Confiabilidad y reputación | Implementado: calificaciones entre participantes de viajes completados, promedios verificables e informes privados moderados por admin. |
| 9 | Pago y seguro | Parcial: cotizaciones y pólizas manuales; Wompi sandbox implementado sin cobros reales; Mercado Pago, PayU y API de aseguradora pendientes. |
| 10 | Dashboard, historial y comunicación | Parcial: dashboard personal basado en datos reales e historial/chat privado persistente por viaje; notificaciones push y externas pendientes. |

Los módulos 11–16 siguen en el inventario. El módulo 6 requiere configuración de correo/Twilio y workers para entrega externa; no existe integración automática con autoridades ni servicios de emergencia. La aplicación no es un servicio de emergencia.

## Cómo ejecutar y validar

- Frontend: `npm install`, `npm run dev`, `npm run build`, `npm run test:routing`.
- Backend: desde `backend`, `composer install`, `php artisan migrate`, `php artisan serve`.
- Suite backend: desde `backend`, `php artisan test`. Si PHP no carga SQLite automáticamente, habilita `pdo_sqlite` y `sqlite3` al ejecutar PHPUnit.
- Configura `.env` de Laravel y la URL de API del frontend para el entorno local; no copies credenciales reales al repositorio.

La documentación de endpoints de autenticación e instalación se encuentra en [backend/README.md](./backend/README.md).

## Estado del módulo 2: mapas y rutas

- La ubicación del dispositivo se solicita solo al pulsar **Usar mi ubicación** y se conserva únicamente en memoria durante la sesión.
- El usuario debe buscar y seleccionar los resultados de origen y destino antes de solicitar una ruta.
- Las rutas viales genéricas para carro/taxi se calculan con OSRM; caminata y bicicleta usan perfiles independientes de OpenStreetMap. Las rutas se dibujan en el mapa y, si el servicio falla, se muestra el error sin inventar geometría ni métricas.
- Moto usa una ruta vial genérica de carro, no un perfil específico. El planificador MIO consulta paradas y segmentos de rutas del servicio público de Metro Cali; no presenta horarios ni frecuencias.
- El MIO usa paradas y trazados del [servicio GTFS público de Metro Cali](https://www.arcgis.com/home/item.html?id=163af9c688444778b74150cd84f64a8b), atribuido a Metro Cali bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Las consultas se paginan para respetar el límite de transferencia del proveedor. No se afirman horarios o frecuencias vigentes: el servicio no expone un calendario activo verificable.
- La búsqueda de direcciones se envía a Nominatim. Al solicitar una ruta desde el GPS, sus coordenadas se envían al proveedor del modo elegido; el navegador no las persiste en la aplicación. Los mapas cargan mosaicos de OpenStreetMap.

Pruebas focalizadas: `npm run test:routing` (proveedores externos simulados, no requiere conexión).

## Módulo 3: búsqueda, filtros y ordenamiento

- `GET /api/trips` requiere token Sanctum y correo verificado. Devuelve únicamente ofertas activas con cupos de otros perfiles verificados y omite correo, contactos de emergencia y demás datos privados.
- La búsqueda permite filtrar por barrio incluido en origen/destino, hora de salida (misma hora), transporte, carrera y universidad. Los resultados se actualizan con una pausa breve mientras se escribe.
- El orden de afinidad es una estimación explicable basada en barrio, transporte y jornada declarados; también se puede ordenar por hora o fecha de publicación. No equivale a reputación ni a una evaluación de seguridad.
- Se retornan hasta 100 ofertas por búsqueda y se informa si hay más resultados. La afinidad se calcula con una función separada del puntaje usado por el módulo de emparejamiento.
- No se habilitan filtros de género o distancia: los perfiles no almacenan preferencias de género voluntarias ni coordenadas de ruta consentidas. Aunque las valoraciones verificables ya existen, la búsqueda aún no ofrece filtro ni orden por reputación.
- Las pruebas feature del endpoint están en `backend/tests/Feature/TripSearchTest.php`; requieren habilitar `pdo_sqlite` y `sqlite3` si la instalación de PHP no los carga por defecto.

## Módulo 4: emparejamiento por zona y horario

- `GET /api/matches` es de solo lectura y requiere una sesión autenticada y correo verificado. Recomienda ofertas activas con cupo de otros perfiles cuyo correo y perfil estén verificados; el cliente no puede enviar ni guardar puntajes de coincidencia.
- La coincidencia se calcula con los datos declarados en el perfil: zona (50 puntos), jornada frente a la hora publicada (35) y transporte preferido (15). Solo se recomiendan ofertas con al menos 30 puntos y se muestran los motivos que aportaron al puntaje; no se presenta como evaluación de seguridad ni usa reputación inventada.
- La zona debe aparecer como una frase completa en el origen o destino para puntuar; las horas de nuevas ofertas deben respetar `HH:mm`. Una hora histórica mal formada no aporta puntos de jornada.
- Los resultados excluyen al usuario actual, ofertas sin cupos, canceladas y perfiles no verificados; no devuelven correos ni contactos privados. Se evalúan como máximo las 200 ofertas más recientes y se informa si el cálculo puede estar truncado.
- La pantalla tiene estados de carga, error, perfil incompleto y sin coincidencias, y permite abrir la búsqueda general de ofertas. Solicitar cupo y la aceptación del anfitrión están implementados en el módulo 5.
- Pruebas feature del emparejamiento y privacidad: `backend/tests/Feature/TripSearchTest.php`.

## Módulo 5: gestión de viajes

- Las cuentas verificadas pueden publicar una oferta asociada a su propio perfil; el servidor fija el estado inicial como activa y valida hora, cupos y longitudes.
- La pantalla consulta las ofertas disponibles, ofertas propias y solicitudes entrantes/salientes desde la API; ya no usa tarjetas de demostración para gestionar viajes.
- Un estudiante con perfil verificado puede solicitar un cupo. El responsable puede aceptar o rechazar; el cupo se descuenta solo al aceptar y las solicitudes duplicadas se rechazan.
- Solicitantes pueden cancelar solicitudes pendientes o liberar una participación aceptada antes del inicio; responsables pueden cancelar ofertas, iniciar un viaje con al menos un pasajero aceptado y marcarlo completado. Al iniciar o cancelar se cierran las solicitudes pendientes y las transiciones se validan en el backend.
- Los datos de solicitudes exponen solo nombre y universidad, nunca correo ni contacto de emergencia. Rutas protegidas por Sanctum y verificación institucional.
- Migración de solicitudes: `backend/database/migrations/2026_10_21_000001_create_trip_requests_table.php`. Cobertura feature: `backend/tests/Feature/TripManagementTest.php`.

## Módulo 6: seguridad y ubicación del viaje

- El botón SOS registra una alerta persistente para el perfil activo y verificado. Si el estudiante marca la casilla de GPS, el navegador solicita permiso en ese momento y envía coordenadas actuales con la alerta; sin consentimiento, no se comparte ubicación. La solicitud no acepta del cliente el nivel de gravedad, estado ni perfil asociado; se limita a tres activaciones por minuto.
- Los perfiles con rol `security` o `admin` pueden consultar las alertas activas, ver solo el nombre y universidad del estudiante, y marcarlas como atendidas con sello de tiempo y usuario responsable.
- Los participantes aceptados de un viaje en curso pueden compartir su última ubicación GPS de forma explícita, consultarla entre miembros del viaje, dejar de compartirla y registrar check-in de salida/llegada. La ubicación actual se reemplaza (no se guarda una ruta histórica), deja de mostrarse tras dos minutos sin actualización y se elimina al completar/cancelar el viaje.
- Un usuario puede guardar correo y teléfono E.164 de un contacto de confianza y activar consentimiento explícito; al retirarlo, esos destinos se borran y los trabajos pendientes vuelven a validar el consentimiento. Alertas SOS, salida de corredor, llegada a radio destino y check-in vencido se encolan por correo, SMS y WhatsApp según proveedores habilitados. Los mensajes no incluyen coordenadas exactas.
- Para geocercas, quien publica confirma la geocodificación y el trazado antes de crear la oferta. Se notifica al salir del corredor configurado (500 m por defecto), entrar en el radio de llegada (300 m) o exceder la duración prevista más 15 minutos sin check-in. Cada participante debe compartir GPS expresamente; se necesita precisión reportada de 250 m o mejor para evaluar geocercas. La geometría exacta se elimina al completar/cancelar.
- Configura `MAIL_MAILER=smtp`, credenciales Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `TWILIO_WHATSAPP_FROM`), aplica migraciones y ejecuta `php artisan queue:work --queue=safety,default`. Programa `php artisan schedule:run` cada minuto para detectar check-ins vencidos. Sin proveedores o destinos configurados, las entregas quedan como `skipped`; no se simula entrega.
- No se contactan automáticamente autoridades ni líneas públicas de emergencia. El equipo de seguridad ve SOS en el panel; la plataforma no sustituye un servicio de respuesta.
- Endpoints: `POST/DELETE /api/trips/{id}/location`, `GET /api/trips/{id}/safety` y `POST /api/trips/{id}/check-ins`. Cobertura feature: `backend/tests/Feature/SafetyAlertTest.php`, `backend/tests/Feature/TripSafetyTrackingTest.php` y `backend/tests/Feature/SafetyNotificationsTest.php`.

## Módulo 7: administración y analytics

- `GET /api/dashboard` entrega conteos reales de usuarios/perfiles, viajes activos y completados, coincidencias persistidas, solicitudes y alertas; también calcula la tasa de aceptación de solicitudes. No inventa métricas de reputación: `trust_score_avg` es `null` hasta contar con valoraciones verificables.
- Los perfiles se agrupan por universidad, barrio y jornada. El rol `admin` ve el conjunto global; `university` queda limitado a su universidad, incluidos los listados recientes. La respuesta no incluye coordenadas de alertas ni datos de contacto.
- El panel consume la API autenticada y exporta solo estadísticas agregadas en JSON.
- Admin puede filtrar cuentas por estado, buscar estudiantes, aprobar/revocar verificación del perfil y bloquear/reactivar cuentas; al bloquear se revocan sus tokens. Universidad solo gestiona estudiantes de su propia institución; roles privilegiados y el estado propio no se modifican.
- La vista de incidentes es filtrable y omite coordenadas; operaciones autorizadas de atención permanecen en el panel de seguridad.
- Los catálogos permiten crear/desactivar sedes, facultades, programas y periodos por universidad, con baja lógica e historial.
- Admin puede importar snapshots GTFS mediante `stops.txt` y `routes.txt`; se validan columnas, identificadores únicos, nombres y coordenadas (máx. 50.000 filas/archivo), y la transacción no guarda importaciones parciales. Esto no importa viajes, `stop_times` ni calendarios; no se publican horarios vigentes ni se cambia el proveedor actual de rutas.
- Checklist 7.1–7.8 implementado con esos límites de alcance. Cobertura feature: `backend/tests/Feature/DashboardAnalyticsTest.php` y `backend/tests/Feature/AdminManagementTest.php`.

## Módulo 8: confiabilidad y reputación

- Solo usuarios con correo y perfil institucional verificados pueden participar. Las calificaciones se habilitan cuando el viaje queda completado y solo se permite una por persona y viaje; el servidor verifica que calificador y destinatario sean participantes aceptados.
- Las calificaciones son enteras de 1 a 5, con comentario opcional. El promedio y el número de valoraciones se calculan desde `trip_reviews`; las cuentas sin calificaciones aparecen como “Sin calificaciones”. Se eliminó el valor inicial ficticio `trust_score=4.8`.
- La búsqueda de viajes muestra solo promedio y cantidad agregados; no incluye comentarios. Los comentarios y autor se muestran únicamente al usuario evaluado.
- Los participantes pueden reportar a otro participante en un viaje en curso o completado, una vez por persona y trayecto. Los reportes son privados para su autor y administración; admin puede marcarlos revisados, tomar acción o descartarlos con nota. El bloqueo/reactivación de cuentas permanece en la gestión administrativa del módulo 7.
- Endpoints: `GET /api/reputation/me`, `GET /api/reputation/profiles/{profile}`, `POST /api/trips/{trip}/reviews`, `POST /api/trips/{trip}/reports`, `GET /api/admin/reports` y `PATCH /api/admin/reports/{report}`. Los endpoints requieren Sanctum y correo verificado; moderación requiere rol `admin`.
- Migraciones: `backend/database/migrations/2026_10_21_000007_create_trip_reviews_and_user_reports.php` y `backend/database/migrations/2026_10_21_000008_remove_default_trust_score.php`. Cobertura feature: `backend/tests/Feature/ReputationTest.php` y `backend/tests/Feature/DashboardAnalyticsTest.php`.

## Módulo 9: pagos y seguro (parcial)

- Cada cuenta tiene seis meses gratuitos desde su fecha de creación. Después, el precio previsto es COP $9.000 mensuales; durante esta etapa no se cobra ni se restringe el acceso. `GET /api/membership` informa estado, fechas y precio previsto.
- Los estudiantes activos y verificados pueden solicitar cotizaciones manuales de productos candidatos de MAPFRE y Seguros Mundial. Los precios se muestran como “por cotizar”; no se ha confirmado una póliza integral que cubra salud, vida y hurto por hasta COP $30.000 al mes.
- Administración registra las condiciones y primas recibidas del proveedor. Solo se permite presentar la póliza para revisión si su prima no supera COP $30.000 al mes; una cotización más alta se conserva como cotización, pero no puede activarse en la plataforma.
- El estudiante adjunta número, vigencia y documento PDF de la póliza comprada externamente. El archivo se almacena en disco privado; solo administración puede descargarlo y activar la cobertura tras verificar la documentación. Solicitar una cotización o subir una póliza no activa cobertura.
- Endpoints de estudiante: `GET /api/insurance/products`, `GET /api/insurance/enrollments/mine`, `POST /api/insurance/enrollments` y `POST /api/insurance/enrollments/{id}/policy`. Administración: `GET /api/admin/insurance/enrollments`, `PATCH /api/admin/insurance/enrollments/{id}` y `GET /api/admin/insurance/enrollments/{id}/document`.
- El checkout Wompi sandbox genera firma de integridad en el servidor y procesa únicamente webhooks `transaction.updated` con firma verificada. Mantiene el estado como prueba; jamás activa membresías ni permite credenciales de producción. Configura `WOMPI_SANDBOX_ENABLED=true` y llaves/secreto de prueba solo en `.env`. Mercado Pago, PayU y la integración API de aseguradora siguen pendientes; no se recaudan pagos reales. No afirmar pólizas/precios hasta tener convenio y documentación verificable. Migración y pruebas: `backend/database/migrations/2026_10_21_000009_create_insurance_enrollments_table.php`, `backend/database/migrations/2026_10_21_000010_create_membership_payments_table.php`, `backend/tests/Feature/InsuranceTest.php`, `backend/tests/Feature/MembershipTest.php` y `backend/tests/Feature/WompiMembershipTest.php`.

## Módulo 10: dashboard, historial y comunicación (parcial)

- El dashboard personal usa ofertas, solicitudes y calificaciones de la API para mostrar ofertas activas, viajes en curso y completados, solicitudes pendientes, valoración e historial. Como las ofertas actuales guardan hora pero no fecha de salida, no inventa “próximos viajes”.
- Chat persistente por viaje disponible únicamente para el responsable y pasajeros aceptados. Lista participantes solo por nombre, limita mensajes a 2.000 caracteres y solicitudes a 30 por minuto; al completar/cancelar queda en solo lectura. Consulta y envío: `GET /api/communication/trips`, `GET /api/trips/{id}/messages`, `POST /api/trips/{id}/messages`.
- El chat no comparte automáticamente ubicación ni ruta; usa los controles de consentimiento del módulo 6 para compartir GPS. No hay notificaciones push/exteriores ni chat en tiempo real; la interfaz actualiza los mensajes cada 12 segundos mientras el dashboard está abierto.
- Migración y pruebas: `backend/database/migrations/2026_10_21_000011_create_trip_messages_table.php` y `backend/tests/Feature/TripCommunicationTest.php`.

## Alineación del inventario adjunto

El inventario de funciones está separado según los módulos que ya usa ViajaU: 4 es emparejamiento, 5 gestión de viajes, 6 seguridad y ubicación, 8 reputación, 9 pagos/seguro y 10 comunicación. Esto difiere de la recomendación resumida del adjunto, que renumera seguridad y pagos; se conserva el orden del proyecto y se asignan las funciones por su responsabilidad. La matriz en la interfaz muestra el estado real: nombres de funciones y cantidades describen alcance, no garantizan implementación. La comunicación externa y pagos reales permanecen pendientes; el módulo 9 permite solicitar cotizaciones y probar Wompi en sandbox, y el módulo 10 incluye chat persistente por viaje para participantes aceptados.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
