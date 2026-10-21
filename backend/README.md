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

## API de autenticación ViajaU

La API expone registro y login con tokens revocables de Laravel Sanctum:

- `POST /api/register` y `POST /api/login`: reciben los datos de registro o login.
- `GET /api/me` devuelve la cuenta y `POST /api/logout` revoca el token actual.
- Las rutas equivalentes `/api/auth/register`, `/api/auth/login`, `/api/auth/me` y `/api/auth/logout` se mantienen como alias.
- `POST /api/auth/email/verification-notification`: reenvía el enlace de verificación.
- `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`: recuperación por correo.
- `PUT /api/auth/profile` y `PUT /api/auth/change-password`: actualizan los datos de la propia cuenta.
- `POST /api/profile/photo`: sube una foto JPG, PNG o WebP de hasta 2 MB.

El campo `university` usa una de estas claves: `uniajc`, `univalle`, `javeriana` o `icesi`. El correo debe coincidir con el dominio configurado para esa universidad. Las rutas privadas requieren la cabecera `Authorization: Bearer <token>`. El frontend utiliza un proxy de Vite hacia `http://127.0.0.1:8000` durante el desarrollo local; configura `VITE_API_URL` si el backend está en otro origen.

El sistema admite roles `student`, `admin`, `security` y `university`; el registro público solo asigna `student`. La asignación de roles privilegiados debe hacerse mediante un proceso interno confiable, nunca desde el formulario público. Admin/university pueden consultar el dashboard y security/admin las alertas de seguridad. Las rutas de viajes, matches y alertas exigen correo verificado. El login bloquea credenciales tras cinco fallos por cuenta/IP y también tiene límite general por IP. Los tokens vencen a los siete días por defecto (`SANCTUM_TOKEN_EXPIRATION`, en minutos).

El panel `GET /api/dashboard` devuelve agregados de viajes, solicitudes, alertas, perfiles y calificaciones verificables por universidad, barrio y jornada. Las cuentas `university` solo reciben resultados de su propia institución; `admin` ve los agregados globales. La respuesta reciente omite coordenadas y contactos. La exportación disponible en la interfaz incluye únicamente los agregados del dashboard. La tasa de aceptación se define como solicitudes aceptadas divididas por todas las solicitudes; el promedio de confianza se deriva exclusivamente de valoraciones de viajes completados y es `null` si aún no existen.

El panel administrativo incluye `GET /api/admin/users`, `PATCH /api/admin/users/{id}`, `GET /api/admin/incidents` y administración de catálogos con `/api/admin/catalog`. Las cuentas institucionales quedan limitadas a sus estudiantes, catálogos e incidentes; nunca pueden modificar roles. Admin puede importar snapshots con `POST /api/admin/transit-feed/import`, usando `feed_version`, `stops` (`stops.txt`) y `routes` (`routes.txt`) como multipart/form-data. Se validan IDs, encabezados, coordenadas, nombres y duplicados antes de guardar en una transacción. El feed solo almacena paradas y rutas: no importa trips, horarios o calendarios y no sustituye el proveedor público utilizado por el planificador. Endpoint del último snapshot: `GET /api/admin/transit-feed/latest`.

La gestión de viajes incluye `GET /api/trips/mine`, `POST /api/trips/{id}/requests`, `PATCH /api/trip-requests/{id}` y `PATCH /api/trips/{id}`. El último permite cancelar, iniciar o completar una oferta respetando sus transiciones válidas; los cupos se descuentan al aceptar solicitudes.

El flujo SOS del módulo 6 está disponible en `POST /api/alerts` para cuentas activas con correo verificado y perfil activo. El servidor crea alertas críticas asociadas a la cuenta autenticada; admite coordenadas opcionales validadas, que el cliente envía solo tras consentimiento GPS explícito. El rol `security` o `admin` con cuenta activa consulta `GET /api/security/alerts` y puede resolverlas con `PATCH /api/security/alerts/{id}/resolve`.

Reputación del módulo 8: `GET /api/reputation/me` devuelve promedio, valoraciones recibidas, viajes elegibles y estado de reportes propios; `GET /api/reputation/profiles/{profile}` solo expone promedios agregados. Participantes aceptados pueden crear una valoración con `POST /api/trips/{trip}/reviews` tras completar el viaje, una sola vez por persona y viaje. El endpoint valida membresía, rating 1–5 y comentario opcional. La búsqueda de ofertas muestra promedio/cantidad, nunca los comentarios. Los reportes se crean con `POST /api/trips/{trip}/reports` en viajes en curso o completados; el autor y el equipo `admin` pueden consultar su estado y solo `admin` puede moderarlos con `GET /api/admin/reports` y `PATCH /api/admin/reports/{report}`.

Las tablas `trip_reviews` y `user_reports` tienen restricciones únicas por viaje/autor/destinatario. El valor inicial demostrativo `student_profiles.trust_score=4.8` se elimina con la migración `2026_10_21_000008_remove_default_trust_score`; la reputación se calcula desde valoraciones verificables, no desde ese campo.

## Módulo 9: cotización y registro manual de seguros (parcial)

Cada cuenta tiene seis meses gratuitos desde `created_at`; luego el precio previsto es COP $9.000 mensuales. `GET /api/membership` informa fechas y estado. `payments_enabled` permanece explícitamente en `false`: no se cobra ni se restringe el acceso mientras no se configure un proveedor.

Estudiantes con cuenta activa, correo verificado y perfil verificado pueden consultar `GET /api/insurance/products`, solicitar cotización con `POST /api/insurance/enrollments` y revisar sus solicitudes con `GET /api/insurance/enrollments/mine`. Administración gestiona las solicitudes mediante `GET /api/admin/insurance/enrollments` y `PATCH /api/admin/insurance/enrollments/{id}`. Al registrar una cotización se exige prima y detalle de coberturas confirmadas por el proveedor. El tope de elegibilidad se configura con `INSURANCE_MONTHLY_BUDGET_COP` (por defecto COP $30.000 al mes).

El estudiante solo puede enviar el número, vigencia y PDF de una póliza comprada externamente después de recibir una cotización dentro del presupuesto (`POST /api/insurance/enrollments/{id}/policy`). El documento queda en `storage/app/private`; administración lo consulta en `GET /api/admin/insurance/enrollments/{id}/document`. La cobertura solo cambia a activa cuando administración verifica que el documento existe y que la prima y vigencia son válidas. Los productos son candidatos de cotización, no ofertas confirmadas. No existe aún integración con Wompi, Mercado Pago, PayU o API de aseguradora; pagos de producción están deshabilitados.

El titular puede registrar email/teléfono E.164 de su contacto en `PUT /api/auth/profile` y debe activar consentimiento explícito. Las alertas SOS, desviación del corredor, llegada a la zona de destino y check-in vencido generan entregas por correo, SMS y WhatsApp. Los destinos no se duplican en registros de entrega: solo se almacena un hash. Los trabajos revalidan consentimiento antes de enviar, reintentan tres veces y registran estados `pending`, `sent`, `failed` o `skipped`. Las coordenadas exactas no se envían al contacto.

Para permitir entrega real configura `MAIL_MAILER=smtp` y `MAIL_*`; Twilio usa `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` y `TWILIO_WHATSAPP_FROM`. No guardes estos secretos en el repositorio. Ejecuta `php artisan queue:work --queue=safety,default`; los avisos de check-in vencido requieren que el scheduler se ejecute cada minuto (`php artisan schedule:run`). Sin credenciales o destinos configurados, los envíos se registran como `skipped`; el SOS sigue disponible en el panel interno.

Al activar la geocerca al publicar una oferta, el frontend geocodifica origen/destino y obtiene una ruta de OSRM o de los datos públicos del MIO. El titular confirma los resultados antes de guardar el trazado; el backend activa un corredor de 500 m, un radio de llegada de 300 m y un plazo de check-in con 15 minutos de gracia. Cada participante debe compartir GPS manualmente y debe reportar precisión de 250 m o mejor para evaluar eventos. Solo se guarda la posición más reciente; se elimina tras completar/cancelar y la geometría de seguridad exacta se borra al cerrar el viaje. `GET /api/trips/{id}/safety` devuelve eventos y el estado de sus canales sin exponer los destinos de contacto.

La aplicación no tiene integración automática con autoridades ni líneas públicas de emergencia y no sustituye un servicio de respuesta. Ante peligro inmediato, se debe contactar directamente a los servicios locales.

Las pruebas feature del módulo están en `backend/tests/Feature/SafetyAlertTest.php`, `backend/tests/Feature/TripSafetyTrackingTest.php` y `backend/tests/Feature/SafetyNotificationsTest.php`.

En producción el backend rechaza solicitudes HTTP y exige HTTPS. Configura TLS en el servidor y, si hay un proxy/load balancer delante, define como proxies confiables únicamente sus direcciones para que Laravel pueda reconocer el protocolo reenviado. Después de instalar dependencias ejecuta `php artisan key:generate`, `php artisan migrate` y `php artisan storage:link`. Configura `MAIL_*`, `APP_URL` y `FRONTEND_URL` para que los enlaces de verificación y recuperación funcionen en tu entorno.
