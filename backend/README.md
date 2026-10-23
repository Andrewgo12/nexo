<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## ViajaU backend setup

This directory contains the ViajaU Laravel API. The product overview and root frontend setup are in [`../README.md`](../README.md). The backend requires PHP `^8.3` and Composer 2.

On Windows PowerShell, install and start the API with:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

The root Vite server proxies `/api` and `/sanctum` to `http://127.0.0.1:8000`. PHPUnit configures SQLite in memory and needs both `pdo_sqlite` and `sqlite3` enabled in the active PHP configuration. Check it with `php --ini`, enable the extensions in that `php.ini`, verify with `php -m`, then run `php artisan test` from this directory. Product CI installs the same extensions; a passing SQLite suite does not establish compatibility with other database engines.

Before production, configure HTTPS and exact CORS/Sanctum/session origins, persistent queue workers, and the Laravel scheduler every minute. Add monitored backups and restore tests, external health/queue/scheduler alerts, and a rollback procedure. This repository does not provide a production infrastructure definition or evidence that these services are deployed.

## API de autenticación ViajaU

La autenticación usa dos flujos Sanctum:

- El navegador de primera parte inicia y cierra sesión con una cookie de sesión `HttpOnly`; los cambios de estado requieren la cookie CSRF de Sanctum.
- Los clientes de API que no envían `Origin` ni `Referer` reciben Personal Access Tokens revocables; el frontend web no almacena ni envía esos tokens.

- `POST /api/auth/register` y `POST /api/auth/login`: reciben los datos de registro o login.
- `GET /api/auth/me` devuelve la cuenta y `POST /api/auth/logout` termina la sesión del navegador o revoca el token actual del cliente API.
- `/api/register`, `/api/login`, `/api/me` y `/api/logout` se mantienen como rutas de compatibilidad.
- Los clientes mantenidos usan `/api/auth/*` como prefijo canónico de autenticación. Las rutas sin prefijo `/auth` quedan por compatibilidad; no se retirarán hasta confirmar cero uso externo durante un ciclo de release y anunciar la retirada con antelación.
- `POST /api/auth/email/verification-notification`: reenvía el enlace de verificación.
- `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`: recuperación por correo.
- `PUT /api/auth/profile` y `PUT /api/auth/change-password`: actualizan los datos de la propia cuenta.
- `POST /api/profile/photo`: sube una foto JPG, PNG o WebP de hasta 2 MB.

El campo `university` usa una de estas claves: `uniajc`, `univalle`, `javeriana` o `icesi`. El correo debe coincidir con el dominio configurado para esa universidad. Las rutas privadas aceptan la cookie de sesión de primera parte o, para clientes API, la cabecera `Authorization: Bearer <token>`. En desarrollo, Vite proxya `/api` y `/sanctum` a `http://127.0.0.1:8000`. En producción, configura `SANCTUM_STATEFUL_DOMAINS` con el host exacto del frontend y `CORS_ALLOWED_ORIGINS` con su origen completo; usa HTTPS, `SESSION_SECURE_COOKIE=true` y `SESSION_HTTP_ONLY=true`. Para subdominios distintos en el mismo sitio, configura `SESSION_DOMAIN` al dominio compartido. No habilites orígenes CORS comodín con credenciales.

El sistema admite roles `student`, `admin`, `security` y `university`; el registro público solo asigna `student`. La asignación de roles privilegiados debe hacerse mediante un proceso interno confiable, nunca desde el formulario público. Admin/university pueden consultar el dashboard y security/admin las alertas de seguridad. Las rutas de viajes, matches y alertas exigen correo verificado. El login bloquea credenciales tras cinco fallos por cuenta/IP y también tiene límite general por IP. Los Personal Access Tokens vencen a los siete días por defecto (`SANCTUM_TOKEN_EXPIRATION`, en minutos); la vigencia de las cookies de navegador se controla con la configuración de sesión.

Las consultas de búsqueda de viajes y analítica están separadas en `TravelOfferSearchService` y `DashboardAnalyticsService`; `TripSafetyController` concentra la ubicación GPS, los check-ins y el resumen de seguridad del viaje, mientras `ViajauController` coordina perfiles, ofertas y solicitudes. Los controladores validan la entrada y gestionan la respuesta HTTP. El dashboard agrupa los conteos de solicitudes en una consulta y devuelve `null` para la tasa cuando no hay solicitudes. La migración `2026_10_21_000013_add_trip_query_indexes` añade índices compuestos para búsquedas/ordenamiento de ofertas, paneles de actividad, alertas y mensajes; los filtros de texto parcial con comodines iniciales siguen requiriendo evaluar el plan y volumen reales de cada base de datos.

El panel `GET /api/dashboard` devuelve agregados de viajes, solicitudes, alertas, perfiles y calificaciones verificables por universidad, barrio y jornada. Las cuentas `university` solo reciben resultados de su propia institución; `admin` ve los agregados globales. La respuesta reciente omite coordenadas y contactos. La exportación disponible en la interfaz incluye únicamente los agregados del dashboard. La tasa de aceptación se define como solicitudes aceptadas divididas por todas las solicitudes; el promedio de confianza se deriva exclusivamente de valoraciones de viajes completados y es `null` si aún no existen.

El panel administrativo incluye `GET /api/admin/users`, `PATCH /api/admin/users/{id}`, `GET /api/admin/incidents` y administración de catálogos con `/api/admin/catalog`. Las cuentas institucionales quedan limitadas a sus estudiantes, catálogos e incidentes; nunca pueden modificar roles. Admin puede importar snapshots con `POST /api/admin/transit-feed/import`, usando `feed_version`, `stops` (`stops.txt`) y `routes` (`routes.txt`) como multipart/form-data. Se validan versión no vacía, encabezados únicos y no vacíos, IDs, coordenadas, nombres y duplicados antes de guardar en una transacción. El feed solo almacena paradas y rutas: no importa trips, horarios o calendarios y no sustituye el proveedor público utilizado por el planificador. Endpoint del último snapshot: `GET /api/admin/transit-feed/latest`.

Las cuentas `university` sin institución asignada no pueden acceder a funciones administrativas; las verificaciones de propiedad también fallan de forma segura si el estudiante no tiene perfil institucional. La creación de viajes y solicitudes tiene límite de 10 operaciones por minuto por cliente autenticado; las transiciones de solicitudes, 20 por minuto. Cotizaciones, checkouts pendientes y revisiones de pólizas serializan las transiciones con bloqueos de fila; si una actualización de póliza falla, se elimina el archivo privado que no quedó asociado a un registro.

Las rutas privadas de negocio exigen una cuenta activa, y el middleware vuelve a leer el estado desde la base de datos para reconocer bloqueos inmediatamente. Cada sesión web lleva una versión de autenticación; al bloquear una cuenta o cambiar/restablecer su contraseña, las sesiones anteriores dejan de autorizar operaciones y la versión no se expone en la respuesta del usuario. La migración `2026_10_21_000015_add_unique_user_id_to_student_profiles` impone un perfil por usuario y aborta con el identificador duplicado si encuentra datos históricos que requieren limpieza antes de desplegarla. Las fotos de perfil nuevas se eliminan si falla la transacción de actualización; los fallos de limpieza quedan registrados.

La migración `2026_10_21_000016_constrain_core_status_values` restringe en la base de datos los estados de usuarios, ofertas, solicitudes, seguros y pagos. Antes de convertir las columnas, detecta y reporta valores históricos fuera de los dominios válidos; limpia esos datos antes de desplegar la migración.

La gestión de viajes incluye `GET /api/trips/mine`, `POST /api/trips/{id}/requests`, `PATCH /api/trip-requests/{id}` y `PATCH /api/trips/{id}`. El último permite cancelar, iniciar o completar una oferta respetando sus transiciones válidas; los cupos se descuentan al aceptar solicitudes.

El flujo SOS del módulo 6 está disponible en `POST /api/alerts` para cuentas activas con correo verificado y perfil activo. El servidor crea alertas críticas asociadas a la cuenta autenticada; admite coordenadas opcionales validadas, que el cliente envía solo tras consentimiento GPS explícito. El rol `security` o `admin` con cuenta activa consulta `GET /api/security/alerts` y puede resolverlas con `PATCH /api/security/alerts/{id}/resolve`.

Reputación del módulo 8: `GET /api/reputation/me` devuelve promedio, valoraciones recibidas, viajes elegibles y estado de reportes propios; `GET /api/reputation/profiles/{profile}` solo expone promedios agregados. Participantes aceptados pueden crear una valoración con `POST /api/trips/{trip}/reviews` tras completar el viaje, una sola vez por persona y viaje. El endpoint valida membresía, rating 1–5 y comentario opcional. La búsqueda de ofertas muestra promedio/cantidad, nunca los comentarios. Los reportes se crean con `POST /api/trips/{trip}/reports` en viajes en curso o completados; el autor y el equipo `admin` pueden consultar su estado y solo `admin` puede moderarlos con `GET /api/admin/reports` y `PATCH /api/admin/reports/{report}`.

Las tablas `trip_reviews` y `user_reports` tienen restricciones únicas por viaje/autor/destinatario. El valor inicial demostrativo `student_profiles.trust_score=4.8` se elimina con la migración `2026_10_21_000008_remove_default_trust_score`; la reputación se calcula desde valoraciones verificables, no desde ese campo.

## Módulo 9: cotización y registro manual de seguros (parcial)

Cada cuenta tiene seis meses gratuitos desde `created_at`; luego el precio previsto es COP $9.000 mensuales. `GET /api/membership` informa fechas y estado. `payments_enabled` permanece explícitamente en `false`: no se cobra ni se restringe el acceso mientras no se configure un proveedor.

Wompi se implementó en modo sandbox para probar el checkout de membresía después del periodo gratis. Configura `WOMPI_SANDBOX_ENABLED=true`, `WOMPI_SANDBOX_PUBLIC_KEY=pub_test_...`, `WOMPI_SANDBOX_INTEGRITY_SECRET=test_integrity_...` y `WOMPI_SANDBOX_EVENTS_SECRET=test_events_...` en el `.env` backend y registra `/api/payments/wompi/webhook` como URL de eventos de pruebas en Wompi. `POST /api/membership/wompi/checkout` genera referencia, firma de integridad y monto desde el servidor; el navegador solo usa la llave pública sandbox. El webhook verifica el checksum SHA-256 usando las propiedades, timestamp y secreto de eventos de Wompi; exige ambiente `test`, referencia, moneda e importe coincidentes. No se admiten llaves de producción. Un pago sandbox se almacena para pruebas y no activa una membresía ni cambia el acceso. No se incluyen llaves/secrets en el repo.

Estudiantes con cuenta activa, correo verificado y perfil verificado pueden consultar `GET /api/insurance/products`, solicitar cotización con `POST /api/insurance/enrollments` y revisar sus solicitudes con `GET /api/insurance/enrollments/mine`. Administración gestiona las solicitudes mediante `GET /api/admin/insurance/enrollments` y `PATCH /api/admin/insurance/enrollments/{id}`. Al registrar una cotización se exige prima y detalle de coberturas confirmadas por el proveedor. El tope de elegibilidad se configura con `INSURANCE_MONTHLY_BUDGET_COP` (por defecto COP $30.000 al mes).

El estudiante solo puede enviar el número, vigencia y PDF de una póliza comprada externamente después de recibir una cotización dentro del presupuesto (`POST /api/insurance/enrollments/{id}/policy`). El documento queda en `storage/app/private`; administración lo consulta en `GET /api/admin/insurance/enrollments/{id}/document`. La cobertura solo cambia a activa cuando administración verifica que el documento existe, que la prima cumple el presupuesto y que la póliza ya está vigente. Los productos son candidatos de cotización, no ofertas confirmadas. Mercado Pago, PayU y la API de aseguradora siguen pendientes; pagos de producción están deshabilitados.

## Módulo 10: dashboard e historial de viajes (parcial)

El panel personal de la interfaz calcula sus indicadores desde `GET /api/trips/mine` y `GET /api/reputation/me`. La fecha de viaje no está almacenada en las ofertas existentes, por lo que el dashboard muestra ofertas activas y viajes registrados, sin presentar estimaciones como próximos viajes.

El chat de grupo persistente se limita a la persona responsable y participantes con cupo aceptado: `GET /api/communication/trips` lista sus chats, `GET /api/trips/{id}/messages` consulta los últimos 100 mensajes y `POST /api/trips/{id}/messages` crea uno de hasta 2.000 caracteres. El chat se cierra para nuevos mensajes al cancelar o completar el viaje; se conservan los mensajes para lectura. No se exponen correos ni teléfonos. El envío tiene límite de 30 solicitudes por minuto.

La interfaz consulta mensajes cada 12 segundos mientras el dashboard está abierto. No hay push, chat en tiempo real, notificaciones externas ni adjuntos; ubicación y rutas no se comparten automáticamente, y mantienen el consentimiento del módulo 6. Pruebas: `backend/tests/Feature/TripCommunicationTest.php`.

El titular puede registrar email/teléfono E.164 de su contacto en `PUT /api/auth/profile` y debe activar consentimiento explícito. Las alertas SOS, desviación del corredor, llegada a la zona de destino y check-in vencido generan entregas por correo, SMS y WhatsApp. Los destinos no se duplican en registros de entrega: solo se almacena un hash. Los trabajos revalidan consentimiento antes de enviar, reintentan tres veces y registran estados `pending`, `sent`, `failed` o `skipped`. Las coordenadas exactas no se envían al contacto.

Para permitir entrega real configura `MAIL_MAILER=smtp` y `MAIL_*`; Twilio usa `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` y `TWILIO_WHATSAPP_FROM`. No guardes estos secretos en el repositorio. Ejecuta un worker persistente con `php artisan queue:work --queue=safety,default --tries=3 --timeout=30 --max-time=3600`; mantén `retry_after` por encima del timeout del worker. Programa `php artisan schedule:run` cada minuto para check-ins vencidos y para monitorear las colas `safety`/`default` (umbral 100 trabajos). Una cola sobre el umbral y una tarea programada fallida generan logs `critical`; el éxito del scheduler de check-ins deja un heartbeat `info` por ejecución. Configura el proveedor de logs/alertas para avisar por backlog crítico, errores de entrega y ausencia de heartbeat durante más de dos minutos. Revisa y reprocesa fallos con `php artisan queue:failed` y `php artisan queue:retry <id>` después de verificar la causa. Sin credenciales o destinos configurados, los envíos se registran como `skipped`; el SOS sigue disponible en el panel interno. La suite `SafetyNotificationsTest` simula respuestas exitosas y fallidas de Twilio; completa además una prueba de humo en el entorno sandbox antes del despliegue.

La geocerca automática está desactivada en ofertas nuevas. Aunque el frontend pueda mostrar rutas de OSRM o del MIO, la API rechaza rutas enviadas por el navegador y no existe aún un verificador/rutador de rutas del lado del servidor. La lógica de corredor de 500 m y radio de llegada de 300 m solo se ejecuta cuando `safety_route_verified` está marcado por un proceso confiable del servidor; las rutas históricas no verificadas no generan esos eventos. Cada participante comparte GPS explícitamente mientras el viaje está en curso y la API solo devuelve coordenadas recientes; se conserva la última posición por participante, se elimina al completar/cancelar y la tarea `viajau:prune-trip-locations` borra registros más antiguos que `SAFETY_LOCATION_RETENTION_HOURS` (24 horas por defecto). La operación requiere el scheduler activo. `GET /api/trips/{id}/safety` está limitado a participantes del viaje.

La aplicación no tiene integración automática con autoridades ni líneas públicas de emergencia y no sustituye un servicio de respuesta. Ante peligro inmediato, se debe contactar directamente a los servicios locales.

Las pruebas feature del módulo están en `backend/tests/Feature/SafetyAlertTest.php`, `backend/tests/Feature/TripSafetyTrackingTest.php` y `backend/tests/Feature/SafetyNotificationsTest.php`.

En producción el backend rechaza solicitudes HTTP y exige HTTPS. Configura TLS en el servidor y, si hay un proxy/load balancer delante, define como proxies confiables únicamente sus direcciones para que Laravel pueda reconocer el protocolo reenviado. Después de instalar dependencias ejecuta `php artisan key:generate`, `php artisan migrate` y `php artisan storage:link`. Configura `MAIL_*`, `APP_URL` y `FRONTEND_URL` para que los enlaces de verificación y recuperación funcionen en tu entorno. Esta guía no acredita un despliegue activo; antes de publicar se necesitan copias de seguridad probadas, monitorización externa, workers persistentes, scheduler cada minuto y un procedimiento de rollback.
