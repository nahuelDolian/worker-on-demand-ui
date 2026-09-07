# Spec: Validación de Deep Links

**Categoría:** 🟨 Seguridad · **Gap origen:** nuevo, relacionado con `esenciales/02-navegacion-y-enrutamiento.md` y `esenciales/01-cierre-oauth-mercadopago-deeplink.md`

## Contexto
Hoy la app ya maneja dos formas de entrada "externa" de datos: el resultado del deep link de Mercado Pago (`Linking.parse(result.url)`, se confía en `queryParams?.status`) y el contenido de un QR (`parseShiftIdFromQrData`, que sí valida formato UUID de forma correcta). A medida que se sumen más deep links (abrir la app desde una notificación push, por ejemplo), cada uno es una superficie donde datos que no vienen del propio backend llegan a la app y pueden disparar navegación o acciones.

## Objetivo
Que todo deep link que la app maneje (el de Mercado Pago, uno futuro de notificaciones, cualquier otro) sea validado antes de usarse para navegar o disparar una acción — mismo espíritu que ya se aplicó bien en `parseShiftIdFromQrData`, pero aplicado de forma consistente a todos los puntos de entrada externa.

## Fuera de alcance
- El diseño de qué deep links existen — eso lo definen las specs correspondientes (`esenciales/01`, `esenciales/06-push-notifications-cliente.md`). Esta spec es sobre la validación, no sobre el diseño del link en sí.

## Historias de usuario (marco de seguridad)
- Como plataforma, quiero que un deep link malformado o malicioso (ej. alguien compartiendo un link `workerondemand://...` armado a mano) no pueda hacer que la app navegue a un lugar inesperado o ejecute una acción no prevista.

## Criterios de aceptación
- [ ] El resultado del callback de Mercado Pago (`queryParams`) se valida contra los valores esperados (`status` en un set conocido de valores) antes de actuar, no se confía en cualquier string.
- [ ] Cualquier deep link nuevo que se sume (ej. desde push notifications) pasa por una validación equivalente antes de disparar navegación.
- [ ] Un deep link malformado o con datos inesperados no crashea la app — se ignora o muestra un estado de error controlado.

## Superficie funcional necesaria
- Un patrón/helper común de "parseo seguro de deep link" (similar en espíritu a `parseShiftIdFromQrData`, generalizado).

## Dependencias
- Se aplica sobre lo que ya exista de `esenciales/01` y lo que se construya en `esenciales/06-push-notifications-cliente.md`.

## Decisiones técnicas pendientes (para vos)
- Si esta validación se centraliza en un único punto (ej. un handler de deep links a nivel de la raíz de navegación) o se resuelve caso por caso en cada pantalla que recibe uno.
