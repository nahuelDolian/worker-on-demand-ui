# Spec: Rediseño visual (estilo Rappi) y animaciones

**Categoría:** 🟦 Extensión · **Gap origen:** pedido directo de Pilu, spliteado de `extensiones/06-rediseno-ux-mapa-emojis.md` en la sesión de grilling del 2026-09-10 (issue frontend #15)

## Contexto
Hoy todas las pantallas usan NativeWind/Tailwind con una paleta ad hoc (`emerald-*`/`neutral-*` sueltos por componente, sin tokens centralizados) y cero animación: `react-native-reanimated` está instalado y configurado (plugin de Babel) pero no se usa en ningún componente. El pedido original de Pilu era "rediseño estilo Rappi, más animaciones" — un paquete de producto/diseño, no una feature técnica puntual.

## Objetivo de esta spec
Fijar el **alcance funcional y el proceso** del rediseño — qué pantallas, en qué orden, con qué librería de animación — dejando los **valores concretos** (paleta exacta, tipografía, densidad pixel a pixel) para una sesión de definición visual aparte, pantalla por pantalla.

## Fuera de alcance
- **Valores concretos de diseño** (hex de colores, familia tipográfica, spacing scale). Eso se define pantalla por pantalla, en una sesión conjunta con Pilu (ver "Proceso" abajo) — posiblemente apoyada en mockups (skill `design` o `prototype`).
- Pantallas que todavía no existen o dependen de specs sin arrancar (ej. el panel ADMIN completo de `extensiones/03-panel-administracion-ops.md` del backend).
- El campo de dirección/autocomplete y el mapa — eso es `extensiones/09-geocoding-direcciones-new-shift.md`. Esta spec cubre cómo se **ve y anima** `NewShiftScreen` una vez que `09` le agregue el campo de dirección, no el campo en sí.

## ⚠️ Nota de proceso — esta spec no está lista para "triggerear y que se haga sola"
A diferencia de `08` y `09`, acá **no alcanza con implementar**: cada pantalla necesita una definición visual conjunta (Pilu + agente) antes de escribir código, porque paleta/tipografía/densidad son decisiones de diseño, no técnicas. El flujo por pantalla es:
1. Se elige la pantalla (ver orden abajo).
2. Sesión corta, conjunta, para definir esa pantalla puntual (principios + valores concretos — puede apoyarse en mockups).
3. Recién ahí se codea esa pantalla.

No repetir este proceso completo para *todas* las pantallas de una — se hace de a una, a medida que le toca el turno.

## Historias de usuario
- Como trabajador o restaurante, quiero que la app se sienta moderna y cuidada (densidad de información, tipografía, motion), no un formulario crudo.
- Como restaurante publicando un turno, quiero que las transiciones de estado (cargando ubicación, turno publicado) se sientan fluidas, no un salto brusco de texto.

## Reglas de negocio ya definidas (sesión de grilling 2026-09-10)
- **Rollout pantalla por pantalla**, no un rediseño de todo de una vez (regla 6 de `CLAUDE.md`: incrementos chicos y revisables).
- **Primera pantalla: `NewShiftScreen`** — coincide con el orden natural, porque ahí entra también el trabajo de `09-geocoding-direcciones-new-shift.md`; conviene resolver ambas juntas en la misma sesión de definición visual.
- **Librería de animación: `react-native-reanimated`** (confirmado — ya está instalada y configurada, cambiarla sería la reescritura que la regla 6 pide evitar).
- **Flujos animados primero**: transiciones de lista/tarjetas en `BrowseShiftsScreen` (browse + postularse) y los 6 estados de feedback de `CheckStatusPanel` en `CheckInScreen` — son los loops que más corre un worker hoy.

## Criterios de aceptación
- [x] Existe un documento (o sección de este spec, actualizada a medida que se cierra cada pantalla) con los principios funcionales del rediseño ("estilo Rappi" traducido a reglas concretas de este producto: cards densas con info jerarquizada, CTAs grandes, motion en transiciones de estado) — sin valores de diseño finales todavía.
- [x] `NewShiftScreen` tiene su sesión de definición visual conjunta completada y su implementación mergeada (junto con `09`) — 2026-09-10. Mockup en canvas de diseño (2 direcciones + sketch descartado archivado), dirección B (wizard de 3 pasos estilo checkout) elegida por Pilu, implementada con TDD (`NewShiftScreen.test.tsx`, 2 tests: gating por paso, flujo completo hasta el resumen) y animaciones de entrada con Reanimated (`FadeInDown` por paso). Fuente Manrope del mockup **no** se llevó al código — requeriría agregar `expo-font`/`@expo-google-fonts` y cablear la carga en el root layout, una decisión de infra aparte; queda con la fuente de sistema que ya usa el resto de la app.
- [x] `BrowseShiftsScreen`, `WorkerHomeScreen` y `SkillEmojiAdminScreen` tienen el mismo lenguaje visual (cards `rounded-2xl border-neutral-100`, chips con emoji, motion de entrada `FadeInDown` con stagger) — 2026-09-10, pedido explícito de Pilu, adelanta el orden original de este criterio. Sin tests nuevos (mismo criterio que el resto de la spec: es re-estilado sobre comportamiento ya cubierto, no lógica nueva) — la suite completa (29 tests) se re-corrió después de cada cambio para confirmar que no se rompió nada. `CheckInScreen` sigue pendiente (no pedido todavía).
- [ ] El resto de las pantallas (`RestaurantHomeScreen`, `ProfileScreen`, etc.) quedan listadas con su estado (pendiente / en definición / hecha) para el siguiente turno de este roadmap — no hace falta terminarlas todas en este incremento.

## Superficie funcional necesaria
- Ninguna todavía a nivel código — el primer entregable de esta spec es el proceso descripto arriba, aplicado a `NewShiftScreen`.
- Cuando se defina cada pantalla: cambios de clases NativeWind/Tailwind (posible introducción de tokens de color centralizados en `tailwind.config.js` en vez de clases sueltas) + componentes `Animated.*`/hooks de Reanimated en las transiciones listadas.

## Dependencias
- `NewShiftScreen` (primera pantalla) depende de que `extensiones/09-geocoding-direcciones-new-shift.md` tenga al menos el campo de dirección funcionando — conviene implementarlas en la misma sesión, no una sin la otra.
- Ninguna dependencia dura con `08-emojis-configurables-por-skill.md`, aunque los emoji van a aparecer visualmente en `SkillChip`/`ShiftCard`, componentes que esta spec también toca.

## Decisiones técnicas pendientes (para vos)
- Paleta de colores y tipografía concretas — se resuelven en la sesión de definición de cada pantalla, no acá.
- Si se centraliza la paleta como tokens de `tailwind.config.js` (`theme.extend.colors`) apenas arranca `NewShiftScreen`, o se posterga esa refactorización hasta tener 2-3 pantallas rediseñadas y ver el patrón real.
- Orden de pantallas después de `NewShiftScreen` (browse, home, profile...) — a definir cuando le toque el turno.
