# Spec: Navegación y Enrutamiento

**Categoría:** 🟩 Esencial · **Gap origen:** `DOCS/ROADMAP.md` §5.2/§6, crítico #3 del roadmap combinado del proyecto
**Estado actual:** `App.tsx` monta un único componente fijo (`WorkerOnboardingScreen`). No hay ninguna librería de navegación instalada. `CheckInScreen` existe y funciona pero es inalcanzable.

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
- [ ] Existe un árbol de navegación con al menos: onboarding (ya existente), check-in/check-out (ya existente, ahora alcanzable).
- [ ] La navegación soporta deep linking (necesario para el callback de Mercado Pago — `esenciales/01` — y para abrir la app desde una notificación push más adelante).
- [ ] El esquema de deep link configurado coincide con `app.json` (`"scheme": "workerondemand"`).
- [ ] Agregar una pantalla nueva al árbol de navegación no requiere tocar `App.tsx` de forma invasiva (la estructura debería ser extensible).

## Superficie funcional necesaria
- Instalación y configuración de una librería de navegación.
- Definición de la estructura inicial de rutas (grupo "onboarding", grupo "autenticado"/protegido para cuando exista auth).
- Reemplazo del render fijo de `App.tsx` por el navegador raíz.

## Dependencias
- Ninguna hacia atrás. Es, junto con `esenciales/01`, lo primero a resolver.
- Bloquea: `esenciales/03-autenticacion-cliente.md`, `esenciales/06-push-notifications-cliente.md`, y el spec externo de marketplace de turnos.

## Decisiones técnicas pendientes (para vos)
- React Navigation vs. Expo Router (dado que ya están en Expo managed workflow, Expo Router es una opción natural por integrarse mejor con deep linking basado en archivos — pero es una preferencia, no una necesidad).
- Estructura de navegación: stack simple vs. tabs vs. una combinación, una vez que se sepa cuántas secciones de primer nivel va a tener la app (hoy son pocas, pero conviene pensarlo con lo que se sabe que viene: turnos, perfil, historial).
