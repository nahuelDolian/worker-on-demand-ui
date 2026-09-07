# Spec: Push Notifications (Cliente)

**Categoría:** 🟩 Esencial · **Gap origen:** complemento directo de `worker-on-demand/DOCS/specs/esenciales/03-push-notifications.md` (backend) — esta spec es la mitad cliente
**Estado actual:** No existe ningún manejo de permisos ni registro de push notifications en la app.

## Contexto
El backend ya tiene el diseño listo del lado del Dispatch & Match Engine (solo falta el adaptador real de FCM, ver spec del backend). Del lado cliente falta todo: pedir permiso, obtener y registrar el token del dispositivo, y manejar qué pasa cuando el usuario toca una notificación.

## Objetivo
Que la app pida permiso de notificaciones en un momento razonable del onboarding (o después), registre el token del dispositivo contra el backend, y que tocar una notificación de "nuevo turno disponible" lleve directo al detalle de ese turno.

## Fuera de alcance
- El envío de la notificación en sí (eso es 100% del lado backend).
- El contenido/diseño de la notificación (ya está definido en el backend: título, cuerpo, `data` con `shiftId`/`skill`).

## Historias de usuario
- Como trabajador, quiero que la app me pida permiso de notificaciones en un momento que tenga sentido (no apenas abro la app por primera vez, sin contexto).
- Como trabajador, quiero recibir la notificación de un turno nuevo aunque tenga la app cerrada o en background.
- Como trabajador, quiero que al tocar la notificación la app se abra directo en el detalle de ese turno.

## Criterios de aceptación
- [ ] La app pide permiso de notificaciones push en un momento contextual (a definir cuál, ver decisiones de producto).
- [ ] Al otorgarse el permiso, el token del dispositivo se registra contra el backend, asociado al trabajador autenticado.
- [ ] Si el trabajador cambia de dispositivo o reinstala la app, el token viejo deja de usarse y se registra el nuevo (no hace falta que la app lo gestione activamente — alcanza con que el registro se repita en cada arranque relevante).
- [ ] Tocar una notificación con un `shiftId` en su `data` navega directo al detalle de ese turno (depende de `esenciales/02-navegacion-y-enrutamiento.md` y de que exista esa pantalla).

## Superficie funcional necesaria
- Manejo de permisos de notificación (`expo-notifications` es la librería estándar en el ecosistema Expo).
- Registro del token contra el endpoint que defina el backend.
- Listener de notificación tocada, integrado con la navegación (deep link).

## Dependencias
- Depende de `worker-on-demand/DOCS/specs/esenciales/03-push-notifications.md` del backend (necesita el endpoint de registro de token).
- Depende de `esenciales/02-navegacion-y-enrutamiento.md` (para el deep link al detalle del turno) y de `esenciales/03-autenticacion-cliente.md` (para saber a qué trabajador asociar el token).

## Decisiones técnicas pendientes (para vos)
- Momento exacto en el flujo donde se pide el permiso (¿al final del onboarding, la primera vez que hay un turno disponible, en una pantalla de configuración?).
- Si se usa `expo-notifications` con push tokens de Expo (más simple, pasa por los servidores de Expo) o FCM directo (más control, requiere más configuración nativa) — esto también depende de la decisión técnica que tomes en la spec del backend.
