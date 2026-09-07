# Worker On Demand UI — Estado del proyecto y hoja de ruta

> **Qué es este documento:** el mismo tipo de relevamiento que se hizo para el backend (`worker-on-demand/DOCS/ROADMAP.md`), pero para este repo: la app mobile (React Native / Expo). Generado leyendo el código real, no solo el README. Complementa a `DOCS/SPEC.md` y `DOCS/CLAUDE.md` del repo backend (que siguen siendo la fuente de verdad de negocio para todo el sistema) con la foto de qué existe hoy del lado cliente, qué está a medias, y qué falta.
>
> **Generado:** 2026-09-04, sobre la rama `main` (única rama con contenido; 4 commits: import inicial + 3 actualizaciones de README).

---

## 1. Resumen ejecutivo

Esta es la app mobile (Expo / React Native) del lado **trabajador** de Worker On Demand. Hoy implementa, con buena calidad de código, **un único flujo completo: el onboarding de un trabajador nuevo** (datos personales → carga de DNI/selfie → vínculo con Mercado Pago) y **una pantalla de check-in/check-out por QR+GPS ya construida pero desconectada del resto de la app**.

### Estado real en una frase
**El código que existe es sólido (validaciones robustas, buena accesibilidad, arquitectura de formularios prolija) pero es una fracción muy chica de la app: no hay navegación, no hay ninguna pantalla para ver o postularse a turnos, no hay login, y — hallazgo nuevo de este relevamiento — el paso de vínculo con Mercado Pago del onboarding no puede completarse de punta a punta hoy en ningún ambiente por un gap de configuración entre este repo y el backend.**

---

## 2. Hallazgo crítico nuevo: el vínculo con Mercado Pago no cierra

`MercadoPagoLinkStep.tsx` abre el flujo de autorización con `WebBrowser.openAuthSessionAsync(...)`, pasándole como `redirectUri` un deep link (`workerondemand://oauth/mercadopago/callback`, vía `Linking.createURL(MERCADOPAGO_MOBILE_REDIRECT_PATH)`). Para que esa función se resuelva, el backend tiene que terminar el callback de OAuth con un **302 a ese deep link** en vez de devolver JSON.

Revisando el backend (`MercadoPagoOAuthController` + `MercadoPagoOAuthProperties`): ese comportamiento **sí está implementado**, pero está condicionado a una propiedad `mercadopago.oauth.mobile-redirect-url` que **no está seteada en ningún lado** — no está en `application.yml`, no está en `.env.example`, no está en `docker-compose.yml`. Por default es `null`, y cuando es `null` el backend devuelve JSON plano en vez de redirigir.

**Consecuencia concreta:** tal como está configurado hoy el sistema (en cualquier ambiente: local, docker-compose, o lo que sea que se despliegue con la configuración actual), `WebBrowser.openAuthSessionAsync` nunca va a recibir el resultado `success` que la app espera — el paso 3 del onboarding (vínculo MP) queda roto en la práctica, aunque cada lado por separado "funcione". Este no es un gap de una sola feature — es un gap de **coordinación entre los dos repos** que ningún README menciona.

Este hallazgo está desarrollado como spec accionable en [`DOCS/specs/esenciales/01-cierre-oauth-mercadopago-deeplink.md`](specs/esenciales/01-cierre-oauth-mercadopago-deeplink.md).

---

## 3. Stack tecnológico (verificado en `package.json` / `app.json`)

- Expo ~51.0.28 (managed workflow), React Native 0.74.5, React 18.2.0
- TypeScript estricto (`tsconfig.json`: `"strict": true`, extiende `expo/tsconfig.base`)
- Formularios: React Hook Form 7 + Zod 3 (validación) + `@hookform/resolvers`
- Estado de servidor: TanStack Query 5 (`queryClient` con `retry: 1`, `refetchOnWindowFocus: false`)
- Estado local/global: Zustand 4 (sin middleware de persistencia — ver gap en sección 6)
- Estilos: NativeWind 4 / Tailwind 3 (`className` en vez de `StyleSheet`)
- Cámara/ubicación/imágenes: `expo-camera` (scanner QR), `expo-location`, `expo-image-picker`
- OAuth in-app: `expo-web-browser` + `expo-linking` (deep linking)
- `react-native-reanimated` instalado (plugin de Babel configurado) pero **no se usa en ningún componente actual** — dependencia lista para cuando haga falta animación.
- **No hay librería de navegación** (ni React Navigation ni Expo Router) — confirmado, no está en `package.json`.
- **No hay testing framework** (ni Jest, ni Testing Library, ni Detox) — `package.json` no tiene ningún script de test, solo `typecheck`.
- **No hay linter configurado** (no se encontró ningún archivo de configuración de ESLint en el repo).
- **No hay `.env.example`** para este repo — a diferencia del backend, que sí documenta sus variables de entorno. La única variable usada (`EXPO_PUBLIC_API_BASE_URL`, con default `http://localhost:8080`) no está documentada en ningún lado del repo.

---

## 4. Arquitectura del código

```
App.tsx                      → monta un único componente fijo: WorkerOnboardingScreen
src/
  api/                       → funciones fetch tipadas contra el backend (checkInApi, workerOnboardingApi)
  components/ui/             → FormTextField, PrimaryButton, SkillChip, StepProgressBar — componentes chicos,
                                bien tipados, con buena accesibilidad (accessibilityRole/Label/Hint en todos)
  constants/                 → geofence.ts (200m, duplicado del backend), skills.ts (4 skills, duplicado del
                                enum de Kotlin — ver gap de sincronización en sección 6)
  lib/                       → cuit.ts (validación AFIP mod-11 real, no un mock), geo.ts (Haversine, duplicado
                                del backend), qr.ts (parseo de QR con validación de formato UUID), queryClient.ts
  screens/
    onboarding/               → WorkerOnboardingScreen (orquestador de 3 steps) + steps/ + schema.ts (Zod)
    checkin/                  → CheckInScreen (completo) + CheckStatusPanel + types.ts
  store/                     → useOnboardingStore (Zustand, sin persistencia)
```

No hay ninguna capa de "navegación" ni "rutas" — cada screen es un componente React normal, y hoy solo uno de ellos (`WorkerOnboardingScreen`) está efectivamente montado.

**Un detalle de calidad a favor:** el código ya replica del lado cliente varias reglas de negocio del backend para dar feedback inmediato (Haversine en `geo.ts` igual que `GeofencePolicy`/`haversineMeters` de Kotlin, distancia máxima de 200m igual a `GeofencePolicy.MAX_CHECK_DISTANCE_METERS`, catálogo de 4 skills igual al enum `Skill`). Esto es bueno para UX (feedback instantáneo sin ida y vuelta al servidor) pero crea una **duplicación que hay que mantener sincronizada a mano** — si el backend cambia el radio del geofence o agrega una skill, hay que acordarse de tocar este repo también. Ver `extensiones/04-configuracion-plataforma.md` del backend (catálogo de skills configurable) como una forma de resolver esto de raíz más adelante.

---

## 5. Inventario de funcionalidades

Leyenda: ✅ completo y alcanzable | ⚠️ construido pero con gaps | ❌ no existe

### 5.1 Onboarding de trabajador
| Paso | Estado | Detalle |
|---|---|---|
| Datos personales (`PersonalInfoStep`) | ✅ | Nombre, email, CUIT/CUIL con validación real de dígito verificador AFIP (no un regex superficial), selección de micro-skills. Llama a `POST /api/workers` (ya implementado en el backend, pese a que el comentario TODO en `workerOnboardingApi.ts` diga lo contrario — ver gap de documentación abajo). |
| Carga de identidad (`IdentityUploadStep`) | ✅ | Cámara/galería para DNI frente, dorso y selfie (cámara obligatoria para la selfie). Sube vía `multipart/form-data` a un endpoint que ya existe en el backend. |
| Vínculo Mercado Pago (`MercadoPagoLinkStep`) | ⚠️ | UI completa y bien resuelta (abre el navegador in-app, maneja éxito/error), pero **no puede completarse end-to-end hoy** — ver hallazgo crítico, sección 2. |
| Progreso visual (`StepProgressBar`) | ✅ | Simple y accesible (`accessibilityRole="progressbar"`). |
| **Persistencia del progreso** | ❌ | El store de Zustand no tiene middleware de persistencia. Si la app se cierra a mitad del onboarding, se pierde todo el estado local — incluyendo el `workerId` ya creado en el backend. Si el usuario vuelve a completar el paso 1, **probablemente falle o duplique el registro** (el backend no fue diseñado para "reanudar" un registro a medio hacer, y esta app tampoco lo contempla). |
| **Comentarios TODO desactualizados** | — | Tanto `checkInApi.ts` como `workerOnboardingApi.ts` tienen comentarios `TODO(backend): not implemented yet` sobre endpoints que **ya están implementados** en `origin/develop` del backend. Esto no es un bug funcional, pero es ruido que puede hacer perder tiempo a cualquiera (persona o agente) que lea el código y asuma que todavía falta ese trabajo del lado backend. |

### 5.2 Check-in / Check-out (QR + GPS)
| Feature | Estado | Detalle |
|---|---|---|
| Escaneo de QR (`CheckInScreen`) | ✅ construido | Usa `expo-camera`, valida el formato del dato escaneado (`parseShiftIdFromQrData`, acepta UUID crudo o URL con `?shiftId=`). |
| Validación de geofence client-side | ✅ construido | Pide ubicación, calcula distancia Haversine contra `GET /api/shifts/{id}/location`, y si está a más de 200m no deja continuar — coherente con que el backend **también** re-valida server-side (defensa en profundidad correcta). |
| Estados de la UI (`CheckStatusPanel`) | ✅ construido | Maneja bien los 6 estados posibles (`scanning`, `validating`, `submitting`, `out-of-range`, `success`, `error`) con mensajes claros. |
| **Alcanzable desde la app** | ❌ | `App.tsx` no lo monta ni existe navegación para llegar acá. Es, en la práctica, código muerto hasta que se resuelva la navegación. |

### 5.3 Todo lo demás (no existe ningún archivo)
| Feature | Estado |
|---|---|
| Login / pantalla de autenticación | ❌ (depende de que el backend tenga auth — hoy no la tiene, ver `worker-on-demand/DOCS/specs/esenciales/01-autenticacion-autorizacion.md`) |
| Listado de turnos disponibles / postularse | ❌ (ya especificado como `worker-on-demand/DOCS/specs/esenciales/04-app-worker-marketplace-turnos.md` — ver nota de organización en sección 7) |
| Ver mi turno asignado / historial | ❌ |
| Perfil del trabajador (ver/editar) | ❌ |
| Registro de token de push notifications | ❌ |
| Manejo de deep link al tocar una notificación | ❌ |
| Pantalla de restaurante (registro, crear turno, elegir postulante) | ❌ — no hay ninguna evidencia de que esto viva en este repo ni en ningún otro (ver `worker-on-demand/DOCS/specs/esenciales/05-dashboard-restaurante.md`) |
| Modo oscuro | ❌ (NativeWind lo soporta out-of-the-box, simplemente no se usó ninguna clase `dark:`) |
| Manejo de sesión expirada / logout | ❌ |

---

## 6. Deuda técnica y gaps transversales (más allá de features faltantes)

- **Sin persistencia de estado** (`useOnboardingStore` sin `persist`): riesgo real de pérdida de progreso y registros duplicados/huérfanos en el backend.
- **Sin manejo de errores de red consistente**: cada mutation maneja su error con un `Text`/`Alert` ad hoc (`(mutation.error as Error).message`) — funciona, pero no hay un patrón único ni manejo de "sin conexión" vs. "el servidor rechazó la request" vs. "error inesperado".
- **Sin persistencia segura de sesión**: no aplica hoy porque no hay login, pero es un prerequisito para cuando lo haya (ver spec de seguridad correspondiente).
- **Sin manejo de permiso denegado permanentemente**: `CheckInScreen` pide permiso de cámara y, si no se otorga, muestra un botón para pedirlo de nuevo — pero si el usuario ya lo denegó "no preguntar de nuevo" (`canAskAgain: false`), ese botón no hace nada útil; falta un fallback que lleve a la configuración del sistema.
- **Sin tests de ningún tipo.**
- **Sin linter configurado** — nada evita, por ejemplo, un `console.log` olvidado o un import sin usar antes de mergear.
- **Sin CI** — no hay `.github/workflows` en este repo tampoco (mismo gap que el backend).
- **Sin configuración de build para stores** — `app.json` no define `icon` ni `splash` (la app usaría los defaults de Expo si se buildeara hoy), y no hay `eas.json` para builds de producción/preview vía EAS.
- **Duplicación de reglas de negocio sin fuente única** (radio de geofence, catálogo de skills — ver sección 4) — funciona hoy porque son solo 2 valores, pero es un riesgo de desincronización silenciosa a futuro.
- **Nota de higiene de repo:** igual que se encontró en el backend, este working tree tiene **todos los archivos marcados como modificados por git** por una diferencia de fin de línea (CRLF/LF) — no es contenido real distinto, solo ruido de configuración de Windows/git. No requiere acción salvo que moleste al hacer diffs; si se quiere resolver, es un tema de `.gitattributes`/`core.autocrlf`, no de código.

---

## 7. Nota de organización: dos specs del backend son, en rigor, de este repo

Cuando se armaron los specs de gaps del backend (`worker-on-demand/DOCS/specs/`), dos de ellos terminaron ahí por practicidad pero su contenido es 100% trabajo de frontend:

- `esenciales/04-app-worker-marketplace-turnos.md` — navegación + pantallas de turnos disponibles/postulaciones, que es exactamente el tipo de trabajo que se haría en **este** repo.
- `esenciales/05-dashboard-restaurante.md` — la interfaz de restaurante, que (si se decide que es mobile) también viviría acá, o en un repo nuevo si se decide que es web.

No los duplico literalmnte acá para no generar dos fuentes de verdad del mismo trabajo — quedan como están, en el repo backend, pero **cuando se planifique el trabajo de este repo, esos dos specs son parte del alcance real de `worker-on-demand-ui`**. Los specs nuevos de este documento (sección 9) son el resto: todo lo que hace falta para que este repo tenga una base sólida (navegación, auth cliente, resiliencia, testing, etc.) — varios de ellos son, de hecho, prerequisito técnico de esos dos specs (no tiene sentido construir la pantalla de turnos sin que exista primero algo de navegación).

---

## 8. Roadmap propuesto para este repo

**Fase 0 — Cerrar lo que ya está construido**
- Resolver el gap de configuración del deep link de Mercado Pago (sección 2) — es la corrección más barata y más urgente: una variable de entorno de un lado, no requiere código nuevo.
- Agregar navegación y conectar `CheckInScreen` al flujo real.

**Fase 1 — Prerequisitos de cualquier pantalla nueva**
- Autenticación cliente (una vez que el backend la tenga).
- Persistencia y resiliencia del onboarding.
- Manejo de errores/estados de red consistente.

**Fase 2 — Completar el loop del trabajador**
- Las pantallas de `esenciales/04-app-worker-marketplace-turnos.md` (del repo backend, ver sección 7).
- Registro de push notifications del lado cliente.

**Fase 3 — Calidad y producción**
- Testing + linting + CI.
- Configuración de build para stores (ícono, splash, `eas.json`).

**Fase 4 — Extensiones**
- Perfil editable, modo oscuro, analítica/crash reporting, i18n si se decide expandir el mercado.

---

## 9. Specs de este repo

Ver [`DOCS/specs/00-INDICE.md`](specs/00-INDICE.md).
