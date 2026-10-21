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

La gestión de viajes incluye `GET /api/trips/mine`, `POST /api/trips/{id}/requests`, `PATCH /api/trip-requests/{id}` y `PATCH /api/trips/{id}`. El último permite cancelar, iniciar o completar una oferta respetando sus transiciones válidas; los cupos se descuentan al aceptar solicitudes.

El flujo SOS del módulo 6 está disponible en `POST /api/alerts` para cuentas activas con correo verificado y perfil activo. El servidor crea alertas críticas asociadas a la cuenta autenticada; admite coordenadas opcionales validadas, que el cliente envía solo tras consentimiento GPS explícito, pero no envía mensajes externos. El rol `security` o `admin` con cuenta activa consulta `GET /api/security/alerts` y puede resolverlas con `PATCH /api/security/alerts/{id}/resolve`. Las notificaciones externas a autoridades/contactos aún no están implementadas.

Durante un viaje en curso, sus participantes aceptados pueden compartir/retirar su ubicación con `POST/DELETE /api/trips/{id}/location`, consultar ubicaciones recientes y check-ins con `GET /api/trips/{id}/safety` y registrar salida/llegada con `POST /api/trips/{id}/check-ins`. Solo se almacena la última posición por participante; se oculta del endpoint tras dos minutos sin actualización y se borra al completar o cancelar el viaje. Los check-ins conservan solo el participante y la hora, no coordenadas.

En producción el backend rechaza solicitudes HTTP y exige HTTPS. Configura TLS en el servidor y, si hay un proxy/load balancer delante, define como proxies confiables únicamente sus direcciones para que Laravel pueda reconocer el protocolo reenviado. Después de instalar dependencias ejecuta `php artisan key:generate`, `php artisan migrate` y `php artisan storage:link`. Configura `MAIL_*`, `APP_URL` y `FRONTEND_URL` para que los enlaces de verificación y recuperación funcionen en tu entorno.
