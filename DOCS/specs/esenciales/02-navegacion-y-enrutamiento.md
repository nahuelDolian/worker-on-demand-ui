# Spec: Navegación y Enrutamiento

**Categoría:** 🟩 Esencial · **Gap origen:** `DOCS/ROADMAP.md` §5.2/§6, crítico #3 del roadmap combinado del proyecto
**Estado actual:** ✅ Implementada (2026-09-07). Expo Router (file-based, `app/`), con `expo-secure-store`/`react-native-gesture-handler`/`react-native-screens`/`expo-constants` como dependencias nuevas. `App.tsx` se eliminó — el root layout (`app/_layout.tsx`) resuelve providers + gate de hidratación de sesión, y `app/index.tsx` redirige a `(auth)` o `(app)` según corresponda. `CheckInScreen` ahora es alcanzable desde el tab "Check-in" del área autenticada.

## Contexto
Esta es la pieza de infraestructura sin la cual ninguna pantalla nueva (turnos disponibles, login, perfil, lo que sea) tiene forma de integrarse a la app. Es, en términos de esfuerzo, probablemente la spec más barata de esta lista con el mayor efecto desbloqueante.

## Objetivo
Dar de alta un árbol de navegación real: que la app pueda moverse entre pantallas, que existan rutas protegidas (una vez que haya auth), y que `CheckInScreen` sea alcanzable desde un flujo real (hoy, aunque sea, desde algún lugar razonable — ej. después de completar el onboarding, o desde una futura pantalla de "mi turno").

## Fuera de alcance
- Las pantallas de negocio en sí (turnos disponibles, postularse) — eso es `worker-on-demand/DOCS/specs/esenciales/04-app-worker-marketplace-turnos.md`. Esta spec es la infraestructura que esa spec va a necesitar.
- Rutas protegidas por rol/autenticación en el sentido de *verificar* la sesión — eso es `esenciales/03-autenticacion-cliente.md`. Acá solo se define la forma en que existen "grupos" de rutas (públicas vs. protegidas), no la lógica de qué las protege.

## Historias de usuario
- Como usuario de la app, quiero poder navegar entre pantallas de forma natural (con historial de "atrás", transiciones, etc.).
- Como trabajador que completó el onboarding, quiero llegar naturalmente a algún punto de entrada de la app (hoy sería el check-in, más adelante sería el marketplace de turnos).
- Como desarrollador, quiero poder abrir la app directamente en una pantalla específica vía deep link (ej. desde una notificación push, o desde el callback de Mercado Pago).

## Reglas de negocio
- No aplica reglas de negocio nuevas — es puramente infraestructura de la app.

## Criterios de aceptación
- [x] Existe un árbol de navegación con al menos: onboarding (ahora repartido entre `(auth)/register` — datos personales — y `(app)/onboarding/*` — identidad + Mercado Pago, autenticados), check-in/check-out (`(app)/(tabs)/checkin`, ahora alcanzable con toggle de modo).
- [x] La navegación soporta deep linking — Expo Router usa el `"scheme"` de `app.json` automáticamente (file-based routing); no se probó todavía el callback real de Mercado Pago end-to-end (bloqueado aparte por `esenciales/01-cierre-oauth-mercadopago-deeplink.md`, gap de config ya documentado).
- [x] El esquema de deep link configurado coincide con `app.json` (`"scheme": "workerondemand"`) — sin cambios, Expo Router lo toma de ahí directamente.
- [x] Agregar una pantalla nueva es un archivo nuevo bajo `app/` — no se tocó `App.tsx` de forma invasiva porque **se eliminó** (Expo Router reemplaza ese patrón por diseño).

## Superficie funcional necesaria
- Instalación y configuración de una librería de navegación.
- Definición de la estructura inicial de rutas (grupo "onboarding", grupo "autenticado"/protegido para cuando exista auth).
- Reemplazo del render fijo de `App.tsx` por el navegador raíz.

## Dependencias
- Ninguna hacia atrás. Es, junto con `esenciales/01`, lo primero a resolver.
- Bloquea: `esenciales/03-autenticacion-cliente.md`, `esenciales/06-push-notifications-cliente.md`, y el spec externo de marketplace de turnos.

## Decisiones técnicas — resueltas por Pilu (2026-09-07)
- **Expo Router**, con **tabs desde el arranque** (no stack simple) — aunque hoy solo hay 2 tabs reales (Check-in, Perfil), se decidió no postergar el andamiaje de tabs para cuando lleguen turnos/historial.
- **Estructura implementada:** `app/(app)/_layout.tsx` es un `Stack` que contiene un grupo `(tabs)` (Check-in + Perfil) como pantalla inicial, más `onboarding/identity` y `onboarding/mercadopago` como pantallas hermanas que se empujan por encima con back nativo (no son tabs — se decidió así para que tengan transición/gesto de "atrás" en vez del comportamiento de swap de un tab oculto). `app/(auth)/_layout.tsx` es un `Stack` simple (login/register/verify-email).
