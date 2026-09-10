---
status: accepted
---

# Geocoding y autocomplete de direcciones sin mapa nativo ni Google Places

**Contexto:** la app corre hoy vía Expo Go — no hay `eas.json` ni dev client configurado. Un widget de mapa visual interactivo (`react-native-maps` sobre tiles OSM, o MapLibre GL Native) no anda en Expo Go: exige migrar a un dev client de EAS, una migración de infra real que hoy no está justificada por sí sola. Google Maps Platform (Places Autocomplete + Maps SDK) da el mejor autocomplete del mercado, pero exige una cuenta de facturación de Google Cloud cargada aunque el uso caiga dentro del tier gratuito.

**Decisión:** para `DOCS/specs/extensiones/09-geocoding-direcciones-new-shift.md`, resolvemos direcciones a lat/lng con un proveedor gratuito compatible con la API de Nominatim que sí permite autocomplete en producción sin self-host (Geoapify o LocationIQ — decisión final del proveedor exacto abierta en esa spec), sin agregar ningún widget de mapa visual.

**Por qué:** resuelve el dolor real y actual (`NewShiftScreen` pide lat/lng tipeada a mano) sin forzar la migración a dev client ni pedirle a Pilu una cuenta de facturación de Google para una spec de extensión.

## Considered Options
- **Google Maps Platform** — mejor autocomplete, pero cuenta de facturación obligatoria y el mismo problema de dev client en Android para el widget de mapa.
- **Mapa visual interactivo** (`react-native-maps`/MapLibre sobre OSM) — mejor UX a futuro, pero exige migrar a EAS dev client primero; no justificado solo por esta spec.
- **(elegida) Solo geocoding + autocomplete de direcciones**, sin widget de mapa.

## Consequences
Un mapa visual real (ver turnos en un mapa, no solo en lista) queda como spec futura, solo si esa migración a dev client se justifica por otro motivo — no colgada de esta. `shiftAddress` (ver `CONTEXT.md` del backend) guarda el texto de dirección devuelto por el proveedor elegido, nunca un `place_id` de Google.
