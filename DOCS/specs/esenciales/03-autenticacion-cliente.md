# Spec: Autenticación Cliente

**Categoría:** 🟩 Esencial · **Gap origen:** complemento directo de `worker-on-demand/DOCS/specs/esenciales/01-autenticacion-autorizacion.md` (backend) — esta spec es la mitad cliente
**Estado actual:** ✅ Implementada y verificada de punta a punta (2026-09-07/08), junto con sus dos prerequisitos (`esenciales/02-navegacion-y-enrutamiento.md`, `seguridad/01-almacenamiento-seguro-sesion.md`). Flujo completo: `PersonalInfoStep` pide contraseña y registra vía `POST /api/workers` → verificación de email → login explícito → área autenticada. Cliente HTTP centralizado (`src/api/httpClient.ts`) con Bearer automático y refresh-en-401. La verificación manual encontró que el backend no tenía CORS configurado (bloqueaba probar desde `expo start --web`, no desde iOS/Android) — **resuelto del lado backend el 09-08** (`worker-on-demand/.../SecurityConfig.kt`). Confirmado con un login real (`worker.test@workerondemand.local`) navegando registro → login → tabs → perfil → logout desde un browser real.

## Contexto
El backend ya no es una API abierta: todo lo que muta estado de turno/usuario/pago exige un JWT (`Authorization: Bearer <accessToken>`), el registro exige una contraseña y verificación de email antes de poder loguearse, y las cuentas bloqueadas devuelven un motivo estructurado en vez de un booleano opaco. La app necesita: una forma de que el usuario se registre con contraseña, verifique su email, inicie sesión, guarde esa sesión de forma segura, la adjunte a cada request, y sepa manejar 401/403/bloqueo sin romperse.

## Objetivo
Dar a la app un flujo de registro + verificación de email + login (+ refresh + logout) conectado 1:1 al backend ya implementado, con la sesión persistida de forma segura entre aperturas de la app.

## Fuera de alcance
- El mecanismo de autenticación en sí (ya está definido y cerrado del lado backend — ver el contrato de API abajo, no hay margen de rediseño acá).
- El almacenamiento seguro en sí mismo — eso es `seguridad/01-almacenamiento-seguro-sesion.md`, esta spec lo usa como dependencia.
- Verificación por teléfono/SMS — no existe del lado backend todavía (solo email).
- Pantalla de "olvidé mi contraseña" — no hay endpoint de recuperación en el backend (fuera de alcance de la spec 01, no está planeado).

## Historias de usuario
- Como trabajador, quiero registrarme con contraseña y verificar mi email antes de poder usar la app normalmente.
- Como trabajador, quiero poder reenviar el código de verificación si no me llegó o expiró.
- Como trabajador, quiero poder iniciar sesión con mis credenciales y quedar autenticado en la app.
- Como trabajador, quiero que la app recuerde mi sesión entre aperturas (no tener que loguearme cada vez que abro la app).
- Como trabajador, quiero poder cerrar sesión.
- Como trabajador con una sesión vencida o inválida, quiero que la app me lleve de vuelta al login de forma clara, no que las pantallas fallen en silencio o con errores confusos.
- Como trabajador o restaurante con la cuenta bloqueada, quiero entender por qué y qué puedo hacer al respecto, no solo ver que algo falla.
- Como trabajador que ya se registró pero cerró la app antes de terminar el onboarding, quiero poder retomar donde quedé al volver a abrir la app (relacionado con `esenciales/04-persistencia-resiliencia-onboarding.md`).

## Reglas de negocio — ya resueltas (por el backend implementado)
1. **¿El registro deja al usuario logueado automáticamente?** No. El registro crea la cuenta con `emailVerified=false` y dispara un código de verificación; recién después de verificar el email se puede loguear (`POST /api/auth/login` devuelve 403 `email_not_verified` si no se verificó). El flujo real es: registro → pantalla de "ingresá el código" → verificar → login explícito.
2. **¿Cómo conviven "en medio del onboarding" y "autenticado normalmente"?** Son estados distintos y secuenciales, no el mismo: `PersonalInfoStep` ahora tiene que pedir también una contraseña (ver abajo) y, apenas se registra, el usuario entra en un estado "registrado pero no verificado ni logueado" — no tiene sesión (no hay `accessToken`) hasta que complete verificación + login. El resto de la spec de persistencia de onboarding (`esenciales/04`) debe contemplar este estado intermedio explícitamente.

## Contrato de API (backend spec 01, ya implementado)

Base URL: la misma que ya usa `EXPO_PUBLIC_API_BASE_URL`. Todas las rutas listadas devuelven/reciben JSON salvo donde se aclara `multipart/form-data`.

### Autenticación de cada request

Toda ruta protegida requiere el header `Authorization: Bearer <accessToken>`. Sin el header, o con un token inválido/vencido, la respuesta es **401** con cuerpo `{"error": "invalid_or_missing_credential"}`. Con un token válido pero de un rol sin permiso para esa ruta (ej. un WORKER pegándole a un endpoint de RESTAURANT), la respuesta es **403** con cuerpo `{"error": "forbidden"}`.

### Registro

| | |
|---|---|
| `POST /api/workers` | Público. Body: `{ fullName, email, cuitCuil, password, skills: string[] }` — `skills` usa los valores del enum `Skill` (`MOZO_BANDEJA`, `BACHERO`, `COCINERO`, `BARISTA`). `password` mínimo 8 caracteres. |
| `POST /api/restaurants` | Público. Body: `{ fullName, email, cuitCuil, password }`. |

Ambos devuelven **201** con `UserResponse`:
```json
{ "id": "uuid", "fullName": "...", "email": "...", "role": "WORKER", "blockInfo": null }
```
Y disparan en el servidor un código de verificación de 6 dígitos a `email` (hoy solo se loguea server-side — no llega un email real todavía, ver nota de infra al final).

`POST /api/workers/{workerId}/identity-documents` (DNI frente/dorso + selfie) ahora requiere estar autenticado como ese mismo `workerId` (WORKER). `multipart/form-data`: `dniFront`, `dniBack`, `selfie`. Devuelve **204**.

### Verificación de email

| | |
|---|---|
| `POST /api/auth/verify-email` | Público. Body: `{ email, code }`. **204** en éxito. **400** `invalid_or_expired_verification_code` si el código no existe/venció/no matchea (mismo error tanto si el email no existe como si el código está mal — no filtra cuál de los dos). **409** `email_already_verified` si ya estaba verificado. |
| `POST /api/auth/resend-verification-code` | Público. Body: `{ email }`. **Siempre 202**, exista o no el email, esté o no ya verificado (anti-enumeración) — la UI no debería decir "email no encontrado", solo "si existe una cuenta con ese email, te reenviamos el código". |

### Login / refresh / logout

| | |
|---|---|
| `POST /api/auth/login` | Público. Body: `{ email, password }`. **401** `invalid_credentials` si el email no existe o la password no matchea (mismo error para ambos casos). **403** `email_not_verified` si las credenciales son correctas pero falta verificar el email. |
| `POST /api/auth/refresh` | Público (el propio refresh token es la credencial). Body: `{ refreshToken }`. Rota el token: el que se usó queda revocado y se devuelve un par nuevo. **401** `invalid_or_expired_token` si el refresh token es inválido/vencido/ya revocado. |
| `POST /api/auth/logout` | Público. Body: `{ refreshToken }`. **Siempre 204** (revocación idempotente — no filtra si el token ya estaba revocado). |

Los tres que devuelven tokens (`login`, `refresh`) responden **200** con:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "opaque-string",
  "expiresInSeconds": 900,
  "user": {
    "id": "uuid",
    "fullName": "...",
    "email": "...",
    "role": "WORKER",
    "blockInfo": null
  }
}
```

`accessToken` es un JWT de vida corta (15 min por defecto) — es lo que va en el header `Authorization` de cada request protegido. `refreshToken` es un string opaco de vida larga (30 días por defecto) que **solo sirve para pedir un accessToken nuevo** vía `/refresh`; guardalo junto al accessToken en el almacenamiento seguro (`seguridad/01`) y usalo para refrescar proactivamente antes de que expire, o reactivamente apenas un request protegido devuelva 401.

### `blockInfo`: cuenta bloqueada (decisión de negocio #3 de la spec backend)

Cuando el usuario logueado (o, más adelante, el turno que intenta crear un restaurante) está bloqueado, `blockInfo` deja de ser `null`:
```json
"blockInfo": {
  "reasonCode": "SETTLEMENT_FAILURE",
  "description": "Se agotaron los reintentos de cobro de un turno y la cuenta quedó bloqueada preventivamente.",
  "remediationHint": "Contactá a soporte de Worker On Demand para revisar el medio de pago vinculado y reactivar la cuenta.",
  "selfResolvable": false
}
```
**Estar bloqueado NO impide loguearse** — el login funciona igual y trae este objeto para que la app pueda mostrar una pantalla explicando el motivo y la remediación (y, si `selfResolvable` es `true` en el futuro, un flujo de auto-resolución; hoy los dos motivos existentes — `SETTLEMENT_FAILURE`, `ADMIN_MANUAL` — son siempre `false`, solo "contactá a soporte"). Lo que sí falla es la acción puntual bloqueada (ej. un restaurante bloqueado intentando crear un turno): esa respuesta es **403** con el mismo shape pero aplanado, sin envolver en `user`:
```json
{
  "error": "account_blocked",
  "reasonCode": "SETTLEMENT_FAILURE",
  "description": "...",
  "remediationHint": "...",
  "selfResolvable": false
}
```
La UI debería reconocer `error === "account_blocked"` en cualquier response 403 y mostrar la misma pantalla/explicación, sea que haya llegado desde el login o desde una acción bloqueada.

### Endpoints de turnos (ya protegidos)

Todos bajo `/api/shifts`, todos requieren `Authorization: Bearer`. El `restaurantId`/`workerId` de quien actúa ya **no se manda en el body** — se resuelve del token. Resumen de a quién le pega qué:

| Método + ruta | Rol requerido | Nota |
|---|---|---|
| `POST /api/shifts` | RESTAURANT | Body sin `restaurantId` (era parte del contrato viejo). **403** `account_blocked` si el restaurante está bloqueado. |
| `POST /api/shifts/{id}/request-hold` | RESTAURANT, dueño del turno | **403** `forbidden` si no es el dueño. |
| `GET /api/shifts/{id}` | Cualquier rol autenticado | RESTAURANT solo ve los propios (**403** si no). WORKER/ADMIN sin restricción. |
| `GET /api/shifts?status=X` | Cualquier rol autenticado | RESTAURANT filtrado a los propios. WORKER/ADMIN ven todos (incluye `?status=BROADCASTING` para que el worker navegue turnos disponibles). |
| `POST /api/shifts/{id}/applications` | WORKER | **Sin body** — la identidad sale del token, ya no es `{ workerId }`. |
| `POST /api/shifts/{id}/select-worker` | RESTAURANT, dueño del turno | Body: `{ workerId }` (acá sí, porque el restaurante elige a un tercero). |
| `POST /api/shifts/{id}/cancel` | RESTAURANT, dueño del turno | |
| `POST /api/shifts/{id}/no-show` | RESTAURANT, dueño del turno | |
| `POST /api/shifts/{id}/dispute` | RESTAURANT o WORKER, parte del turno | |
| `GET /api/shifts/{id}/location` | RESTAURANT o WORKER, parte del turno | |
| `POST /api/shifts/{id}/check-in` | WORKER, el asignado al turno | |
| `POST /api/shifts/{id}/check-out` | WORKER, el asignado al turno | |

Rutas que siguen públicas (sin cambios para esta app): `GET /api/mercadopago/oauth/authorize/{userId}` y `GET /api/mercadopago/oauth/callback` (gap conocido, se cierra en `esenciales/02-mercadopago-oauth-webhooks.md` del backend), `GET /actuator/health`.

## Flujo completo: registro → verificación → login

1. `PersonalInfoStep` pide ahora también una **contraseña** (campo nuevo, no existía) → `POST /api/workers` (o `/api/restaurants` del lado dashboard).
2. Nueva pantalla: "verificá tu email" — input de 6 dígitos + botón "reenviar código" → `POST /api/auth/verify-email` / `POST /api/auth/resend-verification-code`. Nunca revelar si el email existe o no.
3. Verificado el email, la app **no queda logueada sola** — muestra login (puede ser el mismo formulario con el email pre-cargado) → `POST /api/auth/login` → guardar `accessToken` + `refreshToken` en el almacenamiento seguro.
4. El resto del onboarding (vínculo MP, carga de documentos) sigue con la sesión ya autenticada — el `workerId` para `identity-documents` tiene que coincidir con el usuario logueado (si no, 403).

**Nota de implementación (2026-09-07):** el punto 4 se resolvió como dos pantallas independientes (`(app)/onboarding/identity` y `(app)/onboarding/mercadopago`), alcanzables desde el Perfil en vez de forzarse automáticamente después del login. Motivo: `UserResponse` no tiene ningún campo que indique "identidad ya subida" / "MP ya vinculado" — no hay forma de saber, al loguear a alguien, si ya completó esos pasos antes o es la primera vez. Forzar el redirect a esos pasos en cada login habría sido inventar una regla de producto que no está definida (¿se vuelve a mostrar siempre? ¿solo la primera vez, y cómo se sabe cuál es "la primera vez" sin ese campo?) — eso es, en rigor, el trabajo de `esenciales/04-persistencia-resiliencia-onboarding.md`, que todavía no arrancó. Dejarlos como acciones explícitas en el Perfil es el subconjunto de esta spec que se podía cerrar sin pisar esa decisión.

## Criterios de aceptación
- [x] `PersonalInfoStep` pide contraseña y la manda en el registro (`src/screens/onboarding/steps/PersonalInfoStep.tsx`, campo nuevo + `authApi.registerWorker`).
- [x] Existe una pantalla de verificación de email (código + reenvío) entre el registro y el login (`src/screens/auth/VerifyEmailScreen.tsx`, ruta `(auth)/verify-email`).
- [x] Existe una pantalla de login funcional contra `POST /api/auth/login` (`src/screens/auth/LoginScreen.tsx`, ruta `(auth)/login`).
- [x] La sesión persiste entre aperturas de la app — `seguridad/01-almacenamiento-seguro-sesion.md`, con la excepción de web ya documentada ahí.
- [x] Cada request protegido adjunta `Authorization: Bearer <accessToken>` — centralizado en `src/api/httpClient.ts`, ya no hay `fetch` sueltos en `src/api/*.ts`.
- [x] Un 401 dispara refresh automático (single-flight: N requests en paralelo comparten el mismo refresh en vuelo, no disparan N) y, si el refresh también falla, limpia la sesión — el layout del área autenticada reacciona a `status !== 'signed-in'` y redirige al login solo. No se implementó refresh *proactivo* (antes de que expire) — el criterio de abajo solo pide el caso reactivo, que es el que quedó cubierto.
- [x] Cerrar sesión llama a `POST /api/auth/logout`, limpia el estado local y redirige al login (`ProfileScreen` y `BlockedAccountScreen`, mismo patrón en ambos).
- [x] `blockInfo` no nulo (login) o `error === "account_blocked"` (cualquier acción) muestra la explicación + remediación (`BlockedAccountScreen`) — el cliente HTTP detecta el segundo caso en cualquier response y actualiza el store para que se muestre igual que si hubiera venido del login.
- [x] Las pantallas protegidas verifican la sesión antes de renderizar — guard centralizado en `app/(app)/_layout.tsx` (uno solo, no repetido por pantalla).

## Superficie funcional necesaria
- Cliente HTTP (o el wrapper que ya usan las funciones de `src/api/`) que adjunte `Authorization: Bearer` en cada request protegido.
- Interceptor/manejo centralizado de 401 que dispare refresh-o-logout automático (ver criterio de arriba).
- Pantallas de: verificación de email, login, "cuenta bloqueada".
- Integración con la navegación (`esenciales/02-navegacion-y-enrutamiento.md`) para las rutas protegidas.

## Dependencias
- El backend (`worker-on-demand/DOCS/specs/esenciales/01-autenticacion-autorizacion.md`) **ya está implementado** — esta spec puede arrancar sin bloqueos de ese lado.
- Depende de `esenciales/02-navegacion-y-enrutamiento.md` (rutas protegidas) y `seguridad/01-almacenamiento-seguro-sesion.md` (dónde se guarda `accessToken`/`refreshToken`).

## Decisiones técnicas — resueltas (2026-09-07)
- **Estado de sesión:** Zustand (`useSessionStore`) — no hizo falta preguntarlo, ya estaba fijado como convención del proyecto (`worker-on-demand/DOCS/CLAUDE.md` §3: "Zustand para local/global state, React Query para server state"), consistente con `useOnboardingStore` que ya existía.
- **Cliente HTTP centralizado:** sí, decidido por Pilu — `src/api/httpClient.ts` reemplazó los `fetch` sueltos de `workerOnboardingApi.ts` y `checkInApi.ts`.
- **Refresh sin condición de carrera:** single-flight vía una promesa compartida (`inFlightRefresh` en `httpClient.ts`) — el primer 401 dispara el refresh, cualquier otro request que llegue mientras tanto espera esa misma promesa en vez de disparar uno nuevo.

## Nota de infraestructura (para no perder tiempo reimplementando algo que ya existe)
El envío de email de verificación hoy es un stub que solo loguea el código del lado backend (`LoggingVerificationCodeSender`, no hay Resend conectado todavía) — en cualquier ambiente de desarrollo vas a necesitar mirar los logs del backend para conseguir el código hasta que se conecte un proveedor real. No es un bug de esta spec, es un gap de infra ya documentado en el backend.
