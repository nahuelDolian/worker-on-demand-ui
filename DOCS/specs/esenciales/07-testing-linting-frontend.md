# Spec: Testing y Linting

**Categoría:** 🟩 Esencial · **Gap origen:** `DOCS/ROADMAP.md` §3/§6 de este repo
**Estado actual:** Cero tests, cero configuración de linter. `package.json` solo tiene `typecheck` como verificación automatizada.

## Contexto
Hay lógica no trivial que hoy no tiene ninguna red de seguridad: la validación de CUIT/CUIL (`cuit.ts`, algoritmo mod-11 real), el cálculo de distancia (`geo.ts`), el parseo de QR (`qr.ts`), y los schemas de Zod que gatean el onboarding. Un cambio accidental en cualquiera de estos podría romper silenciosamente el onboarding completo.

## Objetivo
Tener cobertura de tests sobre la lógica pura (la más barata y valiosa de testear) y algunos tests de componentes/pantallas clave, más un linter que atrape errores comunes antes de mergear.

## Fuera de alcance
- Tests E2E completos (Detox u otro) — se puede evaluar como ampliación, no es parte del mínimo de esta spec.

## Qué cubrir (prioridad sugerida)
1. **Lógica pura, sin UI:** `isValidCuit`/`normalizeCuit`/`formatCuit` (casos válidos e inválidos reales, no solo el happy path), `distanceInMeters` (casos conocidos con distancia esperada), `parseShiftIdFromQrData` (UUID crudo, URL con query param, datos basura).
2. **Schemas de Zod:** `personalInfoSchema`/`identityUploadSchema` — casos válidos e inválidos por campo.
3. **Componentes clave con lógica de estado:** `CheckInScreen` (los distintos `status.kind` y sus transiciones), el store de onboarding.
4. **Linter:** reglas estándar de TypeScript/React Native/React Hooks (`eslint-plugin-react-hooks` en particular, dado el uso extensivo de hooks custom).

## Criterios de aceptación
- [ ] Existe al menos un test por cada función de `src/lib/` (`cuit.ts`, `geo.ts`, `qr.ts`).
- [ ] Existe al menos un test por cada schema de Zod, cubriendo un caso inválido por regla de validación.
- [ ] Existe un linter configurado y corriendo en el flujo de desarrollo (a mano o vía CI, ver `esenciales/08-cicd-configuracion-build.md`).
- [ ] Se documenta en el `README.md` cómo correr tests y lint localmente.

## Superficie funcional necesaria
No aplica — spec de infraestructura de desarrollo, no de producto.

## Dependencias
- Ninguna hacia atrás. Conviene arrancar en paralelo a las demás specs (cada pantalla/función nueva debería llegar con sus tests, no dejarlo para el final).

## Decisiones técnicas pendientes (para vos)
- Framework de testing: Jest (estándar en el ecosistema RN/Expo) + React Native Testing Library para componentes.
- Configuración de ESLint: `eslint-config-expo` (la que provee Expo por default) vs. una configuración propia más estricta.
- Si se agrega Prettier además de ESLint, y cómo se integran entre sí.
