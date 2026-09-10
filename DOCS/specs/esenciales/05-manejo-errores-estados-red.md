# Spec: Manejo de Errores y Estados de Red

**Categoría:** 🟩 Esencial · **Gap origen:** `DOCS/ROADMAP.md` §6 de este repo
**Estado actual:** Cada pantalla maneja sus errores de forma independiente y ad hoc: `PersonalInfoStep`/`IdentityUploadStep` muestran `(mutation.error as Error).message` en un `Text`; `MercadoPagoLinkStep` usa mensajes fijos en un `catch` genérico; `CheckInScreen` tiene un estado `error` con mensaje libre. No hay distinción consistente entre "no hay conexión", "el servidor rechazó la request" (ej. 400/409 de negocio) y "algo inesperado explotó".

## Contexto
A medida que se sumen más pantallas (turnos, login, perfil), repetir este patrón ad hoc en cada una es una fuente de inconsistencia de UX y de bugs (ej. mostrar `error.message` crudo de una excepción técnica directamente al usuario, en vez de un mensaje entendible).

## Objetivo
Un patrón único y reutilizable para: detectar y comunicar falta de conexión, distinguir errores de negocio (con mensaje útil, ej. "el turno ya no tiene cupo") de errores técnicos (con un mensaje genérico, sin exponer detalles internos), y — donde tenga sentido — ofrecer reintentar.

## Fuera de alcance
- Un sistema de error tracking/monitoreo (Sentry) — eso es `extensiones/03-analitica-crash-reporting.md`. Esta spec es sobre la experiencia del usuario ante un error, no sobre que el equipo se entere de que ocurrió.

## Historias de usuario
- Como trabajador sin conexión a internet, quiero que la app me lo diga claramente, no que cada pantalla falle con un mensaje distinto y confuso.
- Como trabajador que hizo algo que el negocio no permite (ej. postularme a un turno que ya llegó al cupo), quiero un mensaje que me explique qué pasó, no un error técnico.
- Como trabajador ante un error inesperado del servidor, quiero un mensaje genérico y tranquilizador, con la opción de reintentar si tiene sentido.

## Criterios de aceptación
- [ ] Existe un componente/patrón reutilizable para mostrar errores, usado de forma consistente en todas las pantallas (no cada una con su propio `Text` suelto).
- [ ] Un error de red (sin conexión, timeout) se distingue visualmente/textualmente de un error de negocio o técnico.
- [ ] Los mensajes de error de negocio que ya devuelve el backend con contenido útil (ej. `InvalidShiftTransitionException` con `from`/`to`, o el mensaje de `require(...)` de una validación de dominio) se muestran de forma legible, no como JSON crudo.
- [ ] Un error técnico inesperado (5xx, excepción no mapeada) muestra un mensaje genérico, no el string de la excepción.
- [ ] Donde tiene sentido (ej. una request que falló por timeout), existe una acción de "reintentar" consistente.

## Superficie funcional necesaria
- Un tipo/estructura de error común que las funciones de `src/api/` normalicen desde las respuestas del backend (hoy cada función de `src/api/` lanza `new Error(string)` de forma ad hoc).
- Componente(s) de UI reutilizables para mostrar cada categoría de error.
- Detección de estado de conectividad (ej. para distinguir "sin internet" de "el servidor no respondió").

## Dependencias
- Ninguna dura, pero tiene sentido resolverla antes de sumar las pantallas de `esenciales/06` en adelante para no tener que retrofitear el patrón después.

## Decisiones técnicas pendientes (para vos)
- Librería de detección de conectividad (`@react-native-community/netinfo` es la opción estándar del ecosistema) vs. inferir "sin conexión" solo por el tipo de error de fetch.
- Si el manejo de errores se centraliza en un wrapper de TanStack Query (`onError` global, `QueryCache`/`MutationCache`) o se resuelve por componente con un hook compartido.
