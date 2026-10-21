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

Los módulos 7–16 siguen en el inventario y no se han iniciado como trabajo secuencial. El módulo 6 requiere configuración de correo/Twilio y workers para entrega externa; no existe integración automática con autoridades ni servicios de emergencia. La aplicación no es un servicio de emergencia.

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
- No se habilitan filtros de género, reputación o distancia: los perfiles no almacenan preferencias de género voluntarias ni coordenadas de ruta consentidas, y `trust_score` aún no proviene de valoraciones verificables. Estos límites son explícitos para evitar revelar o inventar datos.
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

## Alineación del inventario adjunto

El inventario de funciones está separado según los módulos que ya usa ViajaU: 4 es emparejamiento, 5 gestión de viajes, 6 seguridad y ubicación, 8 reputación, 9 pagos/seguro y 10 comunicación. Esto difiere de la recomendación resumida del adjunto, que renumera seguridad y pagos; se conserva el orden del proyecto y se asignan las funciones por su responsabilidad. La matriz en la interfaz muestra el estado real: nombres de funciones y cantidades describen alcance, no garantizan implementación. Ubicación en tiempo real, emergencias externas, chat, reputación y pagos permanecen pendientes.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
