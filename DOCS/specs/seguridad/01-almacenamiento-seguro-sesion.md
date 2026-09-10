# Spec: Almacenamiento Seguro de Sesión

**Categoría:** 🟨 Seguridad · **Gap origen:** prerequisito de `esenciales/03-autenticacion-cliente.md`
**Estado actual:** ✅ Implementada (2026-09-07), como parte del mismo incremento que cerró `esenciales/03-autenticacion-cliente.md`. `src/lib/secureSession.ts` encapsula `expo-secure-store`. **Excepción de alcance decidida explícitamente:** en **web** no persiste (no-op seguro) — `expo-secure-store` no tiene implementación en esa plataforma y se decidió no mezclar un mecanismo distinto (ej. `localStorage`) que rompería la garantía de seguridad que pide esta spec justamente ahí. En web el login sigue funcionando durante esa sesión de navegador, pero no sobrevive un refresh de página; soportarlo queda fuera de este incremento.

## Contexto
Una vez que exista autenticación, la credencial de sesión (token, lo que sea que defina el backend) va a tener que persistir en el dispositivo entre aperturas de la app. Guardar eso en `AsyncStorage` (no cifrado, accesible por cualquier proceso con acceso al almacenamiento de la app en un dispositivo comprometido/rooteado) es una práctica insegura para un token que da acceso a acciones de negocio reales (postularse a turnos, ver datos personales).

## Objetivo
Que la credencial de sesión se guarde en el almacenamiento seguro que ofrece el sistema operativo (Keychain en iOS, Keystore-backed en Android), no en almacenamiento plano.

## Fuera de alcance
- El diseño del token en sí (JWT, sesión, lo que sea) — eso lo define `worker-on-demand/DOCS/specs/seguridad/03-gestion-sesiones-tokens.md` del backend.

## Historias de usuario (marco de seguridad)
- Como plataforma, quiero que un dispositivo comprometido no exponga trivialmente la sesión de un trabajador solo por tener acceso al sistema de archivos de la app.

## Criterios de aceptación
- [x] La credencial de sesión se guarda usando el mecanismo de almacenamiento seguro del sistema operativo (`expo-secure-store` → Keychain/Keystore), no `AsyncStorage` plano. (En web, no se guarda en ningún lado — ver "Estado actual".)
- [x] La lectura/escritura de la credencial está encapsulada en un único lugar (`src/lib/secureSession.ts`: `saveSession`/`loadSession`/`clearSession`), consumido únicamente por `useSessionStore`.
- [ ] Desinstalar la app elimina la sesión guardada — comportamiento por default de `expo-secure-store`/Keychain/Keystore, no se verificó manualmente en un dispositivo/simulador real todavía (sin acceso a uno en esta sesión de trabajo).

## Superficie funcional necesaria
- Un módulo/hook único de "sesión" que abstraiga el guardado/lectura/borrado de la credencial, consumido por `esenciales/03-autenticacion-cliente.md`.

## Dependencias
- Es dependencia directa de `esenciales/03-autenticacion-cliente.md` — conviene resolverla como parte de esa misma spec, o justo antes.

## Decisiones técnicas — resueltas por Pilu (2026-09-07)
- **Librería:** `expo-secure-store`, tal como sugería esta spec.
- **Qué se guarda:** el bundle completo que devuelve login/refresh — `accessToken` + `refreshToken` + `user` (id/fullName/email/role/blockInfo) — no solo los tokens. Permite hidratar la sesión al abrir la app sin pegarle a ningún endpoint extra (no existe un `GET /me` en el backend).
- **Web fuera de alcance:** ver "Estado actual" arriba — decisión explícita de no perseguir persistencia de sesión en esa plataforma en este incremento.
