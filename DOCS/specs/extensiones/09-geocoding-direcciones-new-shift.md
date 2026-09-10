# Spec: Geocoding y autocomplete de direcciones en `NewShiftScreen`

**Categoría:** 🟦 Extensión · **Gap origen:** pedido directo de Pilu, spliteado de `extensiones/06-rediseno-ux-mapa-emojis.md` en la sesión de grilling del 2026-09-10 (issue frontend #15)

## Contexto
Hoy `NewShiftScreen` (`src/screens/restaurant/NewShiftScreen.tsx`) resuelve la ubicación del turno de dos formas: un botón "Usar mi ubicación actual" (GPS vía `expo-location`) o, si eso falla o el restaurante prefiere, **dos campos de texto para tipear latitud y longitud a mano**. No hay ningún campo de dirección — el dato que persiste `shifts` (`shift_lat`/`shift_lng`, agregados en la migración `V2`) tampoco lo tiene.

La app corre hoy vía Expo Go (no hay `eas.json` ni dev client) — ver [ADR-0001](../../adr/0001-geocoding-sin-mapa-nativo-ni-google-places.md) para por qué esta spec no incluye un widget de mapa visual ni Google Places.

## Objetivo
Reemplazar los campos crudos de lat/lng por un buscador de direcciones con autocomplete (estilo Google Places, sin serlo) que resuelva lo tipeado a coordenadas — y que el trabajador que ve el turno publicado vea una dirección legible, no solo un pin.

## Fuera de alcance
- **Widget de mapa visual** (ver turnos en un mapa, elegir el punto tocando un mapa). Ver ADR-0001 — requiere migrar a un dev client de EAS, no justificado solo por esta spec.
- **Google Places API** específicamente — ver ADR-0001, se evita por el requisito de cuenta de facturación de Google Cloud.
- El rediseño visual de `NewShiftScreen` en sí (paleta, layout) — eso es `extensiones/07-rediseno-visual-y-animaciones.md`, pensado para implementarse en la misma sesión que esta spec.

## Historias de usuario
- Como restaurante publicando un turno, quiero escribir la dirección del local y elegirla de una lista de sugerencias, en vez de buscar mi latitud y longitud a mano.
- Como restaurante, quiero poder seguir usando "mi ubicación actual" (GPS) como hoy, sin tener que además escribir la dirección a mano.
- Como trabajador viendo un turno disponible o ya asignado, quiero ver la dirección en texto (no solo la distancia en km), para saber a qué altura/zona ir antes de aceptar.

## Reglas de negocio ya definidas (sesión de grilling 2026-09-10)
- **Sin widget de mapa nativo** — solo geocoding + autocomplete de texto (ver ADR-0001).
- **Sin Google Places** — proveedor gratuito compatible con la API de Nominatim que sí permita autocomplete en producción (Geoapify/LocationIQ, decisión final abajo).
- Además de `shiftLat`/`shiftLng`, se persiste la **dirección formateada devuelta por el proveedor** (`shiftAddress`, ver `CONTEXT.md` del backend) — el trabajador tiene que poder ver ese dato, no solo un pin/distancia.
- **`NewShiftScreen` es la primera y única pantalla de esta spec** (browse y check-in quedan para una iteración futura si se decide extender el uso del geocoding).
- Es trabajo de los dos repos — **backend primero** (regla 5 de `CLAUDE.md`): el campo nuevo y el contrato de API tienen que existir antes de que el frontend los consuma.
- Cuando el restaurante usa "mi ubicación actual" (GPS), se hace **reverse-geocoding best-effort** con el mismo proveedor para completar `shiftAddress` — si falla, el turno se publica igual, con `shiftAddress` en `null` (mismo criterio de "no bloquear" que ya usa `locationError` hoy en esa pantalla).

## Criterios de aceptación

### Backend (primero) ✅ (2026-09-10)
- [x] Migración Flyway nueva (`V12__add_shift_address.sql`): `shifts.shift_address` y `shifts.shift_place_id` (ambas `TEXT`, nullable — pueden faltar si el geocoding/reverse-geocoding falló). `shift_place_id` agregado además de lo previsto originalmente, por decisión explícita de Pilu en la sesión de grilling (Q11/place_id).
- [x] `CreateShiftRequest` acepta `shiftAddress: String?` y `shiftPlaceId: String?`, ambos opcionales.
- [x] `ShiftResponse` expone `shiftAddress`+`shiftPlaceId`; `ShiftLocationResponse` expone `shiftAddress` (no `shiftPlaceId` — no lo necesita ningún cliente).
- [x] `Shift` (dominio) agrega `val shiftAddress: String?` y `val shiftPlaceId: String?`, sin nueva validación de rango (a diferencia de lat/lng, es texto libre devuelto por el proveedor). Sin test dedicado — mismo criterio que `shiftLat`/`shiftLng`, que tampoco lo tienen: es plumbing sin lógica nueva.

### Frontend (después) ✅ (2026-09-10)
- [x] `createShiftSchema` reemplaza los campos `shiftLat`/`shiftLng` de texto libre como flujo principal por `AddressAutocompleteField` (nuevo, `src/components/ui/`); `shiftLat`/`shiftLng` se derivan de la dirección elegida.
- [x] El botón "Usar mi ubicación actual" se mantiene, y ahora también dispara `reverseGeocode` (`src/lib/locationIq.ts`) para completar `shiftAddress`/`shiftPlaceId` — best-effort, no bloquea si falla.
- [x] Fallback: la carga manual de lat/lng sigue existiendo, colapsada detrás de "¿No encontrás la dirección?" en vez de siempre visible.
- [x] `ShiftCard` muestra `shiftAddress` cuando existe (`ShiftDetailScreen` lo hereda al usar `ShiftCard` internamente).
- [x] `createShift` (`src/api/restaurantApi.ts`) manda `shiftAddress`/`shiftPlaceId` en el body.
- [x] `.env.example`/`.env` nuevos (no existían en el repo) documentando `EXPO_PUBLIC_LOCATIONIQ_API_KEY` — gap que no era parte explícita de esta spec pero es un prerequisito real para que funcione.

## Superficie funcional necesaria
- Backend: migración, cambios en `Shift`, `CreateShiftRequest`, `ShiftResponse`, `ShiftLocationResponse`, `ShiftController`.
- Frontend: cliente del proveedor de geocoding (búsqueda con debounce + reverse-geocoding), componente de autocomplete de direcciones (nuevo, reutilizable), cambios en `NewShiftScreen`/`schema.ts`/`restaurantApi.ts`, y en `ShiftCard`/detalle de turno para mostrar `shiftAddress`.

## Dependencias
- **Backend primero** — el frontend no puede mandar/leer `shiftAddress` hasta que exista la columna y el contrato de API.
- Conviene implementarse junto con `extensiones/07-rediseno-visual-y-animaciones.md` (misma pantalla, misma sesión de definición visual) pero no depende técnicamente de esa spec.

## Decisiones técnicas pendientes (para vos)
- Proveedor exacto: **Geoapify** o **LocationIQ** (ambos compatibles con la API de Nominatim, ambos con tier gratis que permite autocomplete en producción) — evaluar cuota diaria del tier gratis contra el volumen esperado antes de decidir.
- Si se guarda también un identificador del proveedor (`place_id` o equivalente) junto a `shiftAddress`, útil para debugging/cache, o alcanza con el string de dirección solo.
- Estrategia de debounce/rate limiting del lado del cliente para el autocomplete (todos estos proveedores gratuitos tienen límites por segundo/día).
