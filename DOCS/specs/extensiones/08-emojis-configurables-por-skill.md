# Spec: Emojis configurables por skill

**Categoría:** 🟦 Extensión · **Gap origen:** pedido directo de Pilu, spliteado de `extensiones/06-rediseno-ux-mapa-emojis.md` en la sesión de grilling del 2026-09-10 (issue frontend #15)

## Contexto
Hoy el catálogo de skills es el enum fijo de 4 valores `Skill` (`MOZO_BANDEJA`, `BACHERO`, `COCINERO`, `BARISTA`, definido en `worker-on-demand/.../domain/model/Skill.kt`), duplicado como constante en `src/constants/skills.ts` del frontend. Ningún componente (`SkillChip`, `ShiftCard`) usa emoji hoy, solo texto. No existe ninguna pantalla ADMIN funcional en la app — `admin-placeholder.tsx` es un stub que solo permite cerrar sesión, con un comentario explícito de que no hay spec de panel admin arrancada.

Ya existe en el backend un patrón idéntico a lo que necesita esta spec: `platform_commission_config` — una tabla + `PlatformCommissionService`, con un endpoint público de lectura (`GET /api/platform-commission`) y un endpoint `GET/PUT /api/admin/platform-commission` protegido por rol `ADMIN`, editable en caliente sin redeploy.

## Objetivo
Que cada skill tenga un emoji asociado, visible en toda la app, editable por `ADMIN` sin necesidad de un redeploy del backend.

## Fuera de alcance
- **Agregar o quitar skills del catálogo.** El catálogo sigue siendo el enum `Skill` de 4 valores tal cual está — esta spec solo agrega un emoji a cada una de las que ya existen. Convertir el catálogo en datos es alcance de `worker-on-demand/DOCS/specs/extensiones/04-configuracion-plataforma.md` del backend (hoy marcada como desactualizada, sin arrancar — ver nota agregada ahí el 2026-09-10).
- **El resto del panel ADMIN** (desbloquear usuarios, ver disputas, buscar por ID, etc.) — eso es `worker-on-demand/DOCS/specs/extensiones/03-panel-administracion-ops.md` del backend, también sin arrancar. La pantalla que agrega esta spec es una **excepción puntual** a ese orden de prioridad, pedida explícitamente por Pilu — no la adelanta ni la reemplaza (nota cruzada ya agregada en esa spec).

## Historias de usuario
- Como `ADMIN`, quiero poder cambiar el emoji de una skill sin pedirle un deploy a nadie.
- Como trabajador o restaurante, quiero ver el emoji de cada skill en los lugares donde hoy veo su nombre (selector de skill al postularme/publicar un turno, tarjetas de turno, filtro de browse, perfil).

## Reglas de negocio ya definidas (sesión de grilling 2026-09-10)
- Alcance: **un emoji por cada una de las 4 skills existentes**, ni más ni menos — no se anticipa la subdivisión en categorías que Pilu mencionó como visión futura ("dejemoslo así y luego lo escalaremos").
- Mecanismo: **tabla nueva + endpoint**, mismo patrón que `platform_commission_config` — no un valor hardcodeado versionado por deploy (eso no sería "configurable").
- La tabla se clave por un **`skill_code` de texto** (ej. `"MOZO_BANDEJA"`, el mismo string que ya persiste `shifts.required_skill`/`worker_profiles.skills`), no por el ordinal del enum de Kotlin — así, si `04-configuracion-plataforma.md` migra el catálogo a datos en el futuro, esta tabla no necesita una migración rota.
- La pantalla ADMIN **sí** forma parte de esta spec, acotada exclusivamente a: listar las 4 skills existentes y editar el emoji de cada una. No permite agregar filas nuevas (ver "Fuera de alcance").
- Se agregó una nota en `03-panel-administracion-ops.md` (backend) documentando que esta pantalla ya existe, para cuando ese panel completo se implemente.

## Criterios de aceptación

### Backend ✅ (2026-09-10)
- [x] Migración Flyway nueva (`V11__add_skill_emojis.sql`): tabla `skill_emojis` (`skill_code VARCHAR NOT NULL UNIQUE`, `emoji VARCHAR NOT NULL`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`), sembrada con las 4 skills actuales (🍽️/🧽/🧑‍🍳/☕).
- [x] `GET /api/skill-emojis` — público, sin credencial, devuelve el mapa completo `{skillCode, emoji}[]` (mismo criterio que `GET /api/platform-commission`: el dato no es sensible).
- [x] `GET /api/admin/skill-emojis` y `PUT /api/admin/skill-emojis/{skillCode}` (body `{emoji: string}`) — protegidos por rol `ADMIN` (`SecurityConfig`, mismo patrón que el resto de `/api/admin`).
- [x] `PUT` sobre un `skillCode` que no existe en el enum `Skill` devuelve 400 (`SkillEmojiService.update` valida antes de llegar al repositorio; no se pueden crear filas nuevas desde este endpoint).

### Frontend ✅ (2026-09-10)
- [x] `SkillChip` y `ShiftCard` muestran el emoji de la skill junto (no en reemplazo) a su label de texto.
- [x] El selector de skill en `NewShiftScreen` y el filtro de `BrowseShiftsScreen` también muestran el emoji. También agregado en `ShiftDetailScreen` (usa `ShiftCard` internamente, mismo criterio).
- [x] La pantalla ADMIN (`src/screens/admin/SkillEmojiAdminScreen.tsx`, montada desde `admin-placeholder.tsx`, mantiene el botón de logout que ya tenía) lista las 4 skills con su emoji actual y permite editarlo, con feedback de error (`mutation.isError`).
- [x] Si `GET /api/skill-emojis` todavía no resolvió o falla, `SkillChip`/`ShiftCard` caen a mostrar solo el label de texto (sin emoji) — `resolveSkillEmoji` devuelve `undefined`, nunca bloquea la pantalla.

## Superficie funcional necesaria
- Backend: entidad + repositorio + servicio (`SkillEmojiService`, análogo a `PlatformCommissionService`), dos controllers (público + admin, mismo split que `PlatformCommissionController`/`AdminController`).
- Frontend: cliente API (`getSkillEmojis`, `updateSkillEmoji` en el módulo admin), hook de React Query cacheado (los emojis cambian poco, similar a `platform-commission`), actualización de `SkillChip`/`ShiftCard`/selector de skill, pantalla admin nueva.

## Dependencias
- Ninguna dura. Se integra con `03-panel-administracion-ops.md` (nota cruzada ya agregada ahí) y anticipa parte de `04-configuracion-plataforma.md` del backend sin depender de que esa spec exista.

## Decisiones técnicas pendientes (para vos)
- Mecanismo de selección de emoji en la pantalla admin: teclado nativo de emoji del sistema operativo (input de texto simple) vs. una lista curada de emojis sugeridos por skill (gastronómicos) para evitar que se cargue cualquier cosa.
- Emoji default para cuando una skill no tiene fila configurada todavía (fallback antes del primer seed, o si el seed falla).
