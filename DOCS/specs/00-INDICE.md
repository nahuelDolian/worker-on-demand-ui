# Índice de Specs — Worker On Demand UI

> Mismo formato que `worker-on-demand/DOCS/specs/`: cada spec es **funcional + esqueleto técnico neutral**, deja las decisiones de arquitectura (librería de navegación, mecanismo de storage, etc.) en una sección "Decisiones técnicas pendientes" para que las resuelvas vos. Ver `DOCS/ROADMAP.md` de este repo para el contexto completo.
>
> **Importante:** dos specs del alcance real de este repo — navegación de pantallas de negocio (turnos disponibles, postularse) y el dashboard de restaurante — ya están escritas en el repo backend (`worker-on-demand/DOCS/specs/esenciales/04-app-worker-marketplace-turnos.md` y `05-dashboard-restaurante.md`), por cómo se fue armando el trabajo. No se duplican acá; considerá esas dos como parte de este roadmap también.
>
> **Este índice es el de las specs propias del repo frontend.** Para ver el orden combinado con el repo `worker-on-demand` (backend), y el flujo de trabajo recomendado para una sesión de Claude Code, ver `../../../DOCS/00-INDICE-MAESTRO.md` (un nivel arriba del root de este repo) y `../../../CLAUDE.md`.

## Orden de prioridad sugerido

| # | Spec | Categoría | Por qué en ese orden |
|---|---|---|---|
| 1 | [Cierre del OAuth de Mercado Pago (deep link)](esenciales/01-cierre-oauth-mercadopago-deeplink.md) | Esencial | Bloquea el onboarding hoy, en cualquier ambiente. Arreglo barato. |
| 2 | [Navegación y enrutamiento](esenciales/02-navegacion-y-enrutamiento.md) | Esencial | Todo lo demás (incluyendo los 2 specs del repo backend) depende de que exista |
| 3 | [Almacenamiento seguro de sesión](seguridad/01-almacenamiento-seguro-sesion.md) | Seguridad | Prerequisito de autenticación cliente |
| 4 | [Autenticación cliente](esenciales/03-autenticacion-cliente.md) | Esencial | Depende de que el backend tenga auth (`worker-on-demand/DOCS/specs/esenciales/01`) |
| 5 | [Persistencia y resiliencia del onboarding](esenciales/04-persistencia-resiliencia-onboarding.md) | Esencial | Evita perder registros a medio hacer, independiente de todo lo demás |
| 6 | [Manejo de errores y estados de red](esenciales/05-manejo-errores-estados-red.md) | Esencial | Conviene resolverlo antes de sumar más pantallas, no después |
| 7 | *(externo)* [App Worker: marketplace de turnos](../../worker-on-demand/DOCS/specs/esenciales/04-app-worker-marketplace-turnos.md) | Esencial | Vive en el repo backend, ver nota arriba |
| 8 | [Manejo seguro de permisos del dispositivo](seguridad/02-manejo-seguro-permisos-dispositivo.md) | Seguridad | Se puede hacer junto con cualquier pantalla que ya pida permisos |
| 9 | [Validación de deep links](seguridad/03-validacion-deep-links.md) | Seguridad | Se beneficia de que ya exista navegación (#2) |
| 10 | [Push notifications (cliente)](esenciales/06-push-notifications-cliente.md) | Esencial | Depende de `worker-on-demand/DOCS/specs/esenciales/03-push-notifications.md` del backend |
| 11 | *(externo)* [Dashboard Restaurante](../../worker-on-demand/DOCS/specs/esenciales/05-dashboard-restaurante.md) | Esencial | Vive en el repo backend, ver nota arriba |
| 12 | [Testing y linting](esenciales/07-testing-linting-frontend.md) | Esencial | Ideal en paralelo a todo lo anterior |
| 13 | [CI/CD y configuración de build](esenciales/08-cicd-configuracion-build.md) | Esencial | Antes de cualquier build para tienda |
| 14 | [Protección del build de producción](seguridad/04-proteccion-build-produccion.md) | Seguridad | Antes del primer release público |
| 15 | [Perfil de trabajador editable](extensiones/01-perfil-trabajador-editable.md) | Extensión | |
| 16 | [Modo oscuro](extensiones/02-modo-oscuro.md) | Extensión | |
| 17 | [Analítica y crash reporting](extensiones/03-analitica-crash-reporting.md) | Extensión | Útil tenerlo temprano en la práctica, aunque no bloquea nada |
| 18 | [Internacionalización](extensiones/04-internacionalizacion.md) | Extensión | Solo si se planea expandir fuera de Argentina |
| 19 | [Accesibilidad avanzada](extensiones/05-accesibilidad-avanzada.md) | Extensión | La base ya es buena; esto es formalizarla |
| 20 | [Rediseño UX + mapa/geocoding + emojis](extensiones/06-rediseno-ux-mapa-emojis.md) | Extensión | Placeholder (2026-09-09) — necesita su propia sesión de grilling (proveedor de mapa, alcance de emojis) antes de spliteares en specs concretas |

## Categorías
🟩 **Esenciales** — sin esto la app no es usable de punta a punta o no es segura de operar.
🟨 **Seguridad** — protege datos del usuario y del negocio, no siempre visible como "feature".
🟦 **Extensiones** — mejora el producto, no bloquea un MVP funcional.
