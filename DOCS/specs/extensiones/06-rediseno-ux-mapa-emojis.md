# Spec: Rediseño UX + Mapa/Geocoding + Emojis por Skill

**Categoría:** 🟦 Extensión · **Gap origen:** pedido directo de Pilu (mensaje sobre UX/diseño), registrado en `HANDOFF.md` 2026-09-09 como "paquete grande, no arrancado"
**Estado actual:** ❌ No arrancada. Spec deliberadamente dejada sin resolver — Pilu pidió explícitamente "dejemos el spec/ticket bien definido y lo tomamos posteriormente" en la sesión de grilling del 2026-09-09, para no forzar decisiones de producto en el mismo momento en que se estaba resolviendo otro batch de specs.

## Contexto
Pedido textual (parafraseado del handoff): rediseño de la app estilo Rappi, más animaciones, emojis por skill/categoría configurables por ADMIN, y un mapa gratuito con buscador de direcciones estilo Google Places. Es un paquete de varias specs potenciales, no una sola — cada parte tiene decisiones de producto/proveedor propias que todavía no se discutieron.

## Fuera de alcance de este documento
Este archivo **no** es la spec final — es el placeholder que documenta el pedido y dimensiona las decisiones pendientes, para que la próxima sesión de grilling sobre este tema no arranque de cero. No se toca código a partir de este archivo tal cual está.

## Componentes identificados (a separar en specs propias cuando se grille cada uno)
1. **Rediseño visual estilo Rappi** — paleta, tipografía, componentes, densidad de información.
2. **Animaciones** — transiciones entre pantallas, micro-interacciones (¿en qué flujos primero?).
3. **Emojis por skill/categoría, configurables por ADMIN** — necesita saber si "configurable" significa un mapeo editable en `platform_commission_config`-style (tabla + endpoint ADMIN) o algo más simple (constante versionada en el cliente).
4. **Mapa gratuito + buscador de direcciones estilo Google Places** — necesita elegir proveedor (ver decisiones pendientes) y dónde se usa primero (crear turno con ubicación, browse de turnos cercanos, check-in).

## Reglas de negocio a definir (no responder sin Pilu)
- Alcance del sistema de emojis: ¿un emoji por `Skill` (4 valores fijos hoy: mozo, bachero, cocinero, barista) alcanza, o se espera que crezca a categorías más finas?
- ¿El rediseño aplica a las pantallas ya construidas (worker home/browse, restaurant home/new-shift) de una sola vez, o se va migrando pantalla por pantalla mientras se construyen las specs pendientes del índice?

## Decisiones técnicas pendientes (para Pilu)
- **Proveedor de mapa + geocoding**: tiene que ser gratuito o con tier gratuito suficiente para el volumen esperado. Candidatos típicos a evaluar en la próxima sesión: OpenStreetMap/Leaflet + Nominatim (geocoding), MapLibre, o el tier gratuito de Google Maps Platform (que no es realmente gratis ilimitado, ver cuotas). No se eligió ninguno todavía.
- **Buscador de direcciones estilo Google Places**: depende de qué proveedor de geocoding se elija arriba — algunos (Nominatim) tienen rate limits bajos para autocomplete en vivo.
- **Alcance de "configurable por ADMIN"** para los emojis: tabla nueva + endpoint (`GET/PUT /api/admin/skill-emojis` o similar, mismo patrón que `platform_commission_config`) vs. hardcodeado y versionado por deploy.
- Librería de animaciones (Reanimated ya está disponible vía Expo, pero no confirmado si es la elegida).

## Dependencias
- Ninguna dura hacia atrás. No bloquea ni es bloqueada por el resto del backlog — es mejora de experiencia sobre lo que ya funciona.

## Próximo paso
Sesión de grilling dedicada exclusivamente a este documento, spliteándolo en 2-4 specs numeradas propias (este archivo se retira del índice una vez spliteado, o se deja como spec "madre" con links a las hijas — decisión de esa sesión, no de esta).
