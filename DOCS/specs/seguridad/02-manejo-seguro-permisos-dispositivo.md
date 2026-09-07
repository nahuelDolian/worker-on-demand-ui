# Spec: Manejo Seguro de Permisos del Dispositivo

**Categoría:** 🟨 Seguridad · **Gap origen:** `DOCS/ROADMAP.md` §6 de este repo
**Estado actual:** `CheckInScreen` e `IdentityUploadStep` piden permisos de cámara/ubicación/galería, pero solo manejan el camino "el usuario todavía no decidió" o "recién lo negó" — no manejan el caso de un permiso denegado permanentemente (`canAskAgain: false` en `CheckInScreen`, ni chequeado en absoluto en `IdentityUploadStep`).

## Contexto
En iOS y Android, después de que un usuario deniega un permiso una o más veces, el sistema deja de mostrar el diálogo nativo y hay que mandarlo a la configuración de la app manualmente. Hoy, si eso pasa, el botón "Habilitar cámara" de `CheckInScreen` simplemente vuelve a pedir el permiso silenciosamente sin efecto — el trabajador queda trabado sin entender por qué.

## Objetivo
Que cada pantalla que depende de un permiso del sistema (cámara, ubicación, galería) maneje correctamente los tres estados posibles: no pedido todavía, denegado pero se puede volver a pedir, y denegado permanentemente (con un camino claro a la configuración del sistema).

## Fuera de alcance
- Cambiar qué permisos se piden o cuándo — eso ya está bien definido por la funcionalidad de cada pantalla.

## Historias de usuario
- Como trabajador que denegó permanentemente el permiso de cámara, quiero que la app me explique que lo necesito y me lleve directo a la configuración del sistema para habilitarlo, en vez de un botón que no hace nada.
- Como trabajador, quiero entender por qué la app necesita cada permiso antes de que el sistema me lo pida (esto ya está parcialmente resuelto vía las descripciones en `app.json`, que se muestran en el diálogo nativo del sistema).

## Criterios de aceptación
- [ ] `CheckInScreen`: si el permiso de cámara fue denegado permanentemente, el botón lleva a la configuración del sistema (no vuelve a intentar `requestCameraPermission`).
- [ ] Igual tratamiento para el permiso de ubicación en el mismo flujo.
- [ ] `IdentityUploadStep`: hoy solo muestra un `Alert` genérico si el permiso no fue otorgado — se suma el mismo manejo de "denegado permanentemente → ir a configuración".
- [ ] El patrón queda como un helper reutilizable, no repetido a mano en cada pantalla.

## Superficie funcional necesaria
- Un helper compartido que, dado el resultado de una consulta de permiso, decida si mostrar "pedir de nuevo" o "ir a configuración" (`Linking.openSettings()`).

## Dependencias
- Ninguna — se puede resolver de forma aislada sobre las pantallas ya existentes.

## Decisiones técnicas pendientes (para vos)
- Si el helper vive en `src/lib/` (junto a las demás utilidades) como una función pura reutilizable, o como un hook.
