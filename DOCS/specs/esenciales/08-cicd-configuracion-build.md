# Spec: CI/CD y Configuración de Build

**Categoría:** 🟩 Esencial · **Gap origen:** `DOCS/ROADMAP.md` §6 de este repo
**Estado actual:** No hay `.github/workflows`. `app.json` no define `icon` ni `splash` (usaría los defaults de Expo). No hay `eas.json` para builds gestionados. No hay `.env.example` documentando `EXPO_PUBLIC_API_BASE_URL`.

## Contexto
Mismo gap que el backend (que tampoco tiene CI), más lo específico de una app mobile: no hay forma configurada de generar un build instalable (para testing interno o para las stores) más allá de correr `expo start` en desarrollo.

## Objetivo
1. Un pipeline de CI que corra typecheck, lint y tests (una vez que existan, spec `esenciales/07`) en cada cambio.
2. Configuración de build (EAS Build u otra) para poder generar binarios instalables (al menos para testing interno vía TestFlight/Play Internal Testing) sin depender de que alguien lo haga a mano desde su máquina.
3. Assets mínimos de identidad de la app (ícono, splash) — hoy ausentes.

## Fuera de alcance
- El proceso de publicación en las stores en sí (revisión, metadata de la ficha, capturas) — eso es un proceso más amplio que excede una spec técnica.

## Historias de usuario (marco de developer experience)
- Como desarrollador, quiero que cada Pull Request corra typecheck/lint/tests automáticamente.
- Como equipo, quiero poder generar un build instalable de la app para testing interno sin que dependa de la máquina de una persona específica.
- Como usuario final, quiero que la app tenga un ícono y splash screen propios, no los genéricos de Expo.

## Criterios de aceptación
- [ ] Existe un pipeline de CI que corre en cada push/PR: `typecheck` (ya existe el script), lint (una vez resuelta `esenciales/07`), tests (ídem).
- [ ] Existe una configuración de build (`eas.json` u otra) que permite generar un binario para al menos una plataforma (Android o iOS) sin pasos manuales más allá de disparar el build.
- [ ] `app.json` define `icon` y `splash` con assets propios de la marca, no los defaults de Expo.
- [ ] `.env.example` existe y documenta `EXPO_PUBLIC_API_BASE_URL` (y cualquier otra variable que se sume, ej. la de push notifications).

## Superficie funcional necesaria
No aplica — infraestructura, no producto.

## Dependencias
- Se beneficia de `esenciales/07-testing-linting-frontend.md` para tener algo que correr en CI, pero el build en sí no depende de eso.

## Decisiones técnicas pendientes (para vos)
- Proveedor de CI: GitHub Actions (consistente con dónde vive el repo) vs. otro.
- EAS Build (el camino más directo dado que ya están en Expo managed workflow) vs. un pipeline de build nativo propio.
- Quién diseña/provee los assets de ícono/splash (esto es más una tarea de diseño que técnica).
