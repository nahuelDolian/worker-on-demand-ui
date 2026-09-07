# Spec: Almacenamiento Seguro de Sesión

**Categoría:** 🟨 Seguridad · **Gap origen:** prerequisito de `esenciales/03-autenticacion-cliente.md`
**Estado actual:** No aplica todavía (no hay sesión que guardar), pero es una decisión que hay que tomar bien desde el principio, no parchear después.

## Contexto
Una vez que exista autenticación, la credencial de sesión (token, lo que sea que defina el backend) va a tener que persistir en el dispositivo entre aperturas de la app. Guardar eso en `AsyncStorage` (no cifrado, accesible por cualquier proceso con acceso al almacenamiento de la app en un dispositivo comprometido/rooteado) es una práctica insegura para un token que da acceso a acciones de negocio reales (postularse a turnos, ver datos personales).

## Objetivo
Que la credencial de sesión se guarde en el almacenamiento seguro que ofrece el sistema operativo (Keychain en iOS, Keystore-backed en Android), no en almacenamiento plano.

## Fuera de alcance
- El diseño del token en sí (JWT, sesión, lo que sea) — eso lo define `worker-on-demand/DOCS/specs/seguridad/03-gestion-sesiones-tokens.md` del backend.

## Historias de usuario (marco de seguridad)
- Como plataforma, quiero que un dispositivo comprometido no exponga trivialmente la sesión de un trabajador solo por tener acceso al sistema de archivos de la app.

## Criterios de aceptación
- [ ] La credencial de sesión se guarda usando el mecanismo de almacenamiento seguro del sistema operativo, no `AsyncStorage` plano.
- [ ] La lectura/escritura de la credencial está encapsulada en un único lugar del código (no repetida en cada pantalla que la necesite).
- [ ] Desinstalar la app elimina la sesión guardada (comportamiento por default de estos mecanismos, verificar que se mantenga).

## Superficie funcional necesaria
- Un módulo/hook único de "sesión" que abstraiga el guardado/lectura/borrado de la credencial, consumido por `esenciales/03-autenticacion-cliente.md`.

## Dependencias
- Es dependencia directa de `esenciales/03-autenticacion-cliente.md` — conviene resolverla como parte de esa misma spec, o justo antes.

## Decisiones técnicas pendientes (para vos)
- Librería: `expo-secure-store` es la opción estándar en el ecosistema Expo managed workflow.
- Si además de la credencial de sesión conviene guardar ahí algo más (ej. el `workerId`) o solo lo estrictamente sensible.
