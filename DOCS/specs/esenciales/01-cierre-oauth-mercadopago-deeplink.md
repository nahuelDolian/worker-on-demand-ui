# Spec: Cierre del flujo OAuth de Mercado Pago (deep link end-to-end)

**Categoría:** 🟩 Esencial · **Gap origen:** hallazgo nuevo de este relevamiento, `DOCS/ROADMAP.md` §2 de este repo
**Estado actual:** ✅ Cerrada para el target web (2026-09-08) — `mercadopago.oauth.mobile-redirect-url` seteada vía `MERCADOPAGO_MOBILE_REDIRECT_URL` (backend) apuntando a `app/oauth/mercadopago/callback.tsx` (ruta nueva de Expo Router). Verificado con un click real: el redirect llega a los servidores reales de `auth.mercadopago.com.ar` (rechazado ahí por ser `client_id` de placeholder — eso es infra de credenciales de MP, no de este flujo). Pendiente real: el mismo mecanismo no sirve nativo *y* web a la vez con un solo valor fijo — ver nota en `MercadoPagoOAuthProperties.kt` del backend, queda para cuando se ataque `esenciales/02-mercadopago-oauth-webhooks.md`.

## Contexto
1. `MercadoPagoLinkStep` llama `WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri)`, donde `redirectUri = Linking.createURL(MERCADOPAGO_MOBILE_REDIRECT_PATH)` (resuelve a algo como `workerondemand://oauth/mercadopago/callback`).
2. Esa función de Expo **solo se resuelve con `result.type === 'success'`** si, en algún momento, el navegador in-app es redirigido a una URL que empiece con ese `redirectUri`.
3. El backend (`MercadoPagoOAuthController.callback`) sí sabe hacer ese redirect — pero únicamente si `properties.mobileRedirectUrl` no es `null`. Y hoy, en todo el repo backend, esa propiedad nunca se define (ni en `application.yml`, ni en `.env.example`, ni en `docker-compose.yml`).
4. Resultado: hoy, en cualquier ambiente levantado con la configuración tal cual está en el repo, el callback devuelve JSON en vez de redirigir, `openAuthSessionAsync` nunca ve un `success`, y el trabajador queda con el navegador in-app abierto sin que la app se entere de nada.

## Objetivo
Que completar el vínculo de Mercado Pago desde la app mobile funcione de punta a punta en al menos un ambiente real (local/desarrollo como mínimo).

## Fuera de alcance
- Cambiar el diseño del flujo OAuth en sí — ya está bien pensado en ambos lados, es pura conexión de configuración.
- Cualquier otro tema de Mercado Pago (refresh token, webhooks) — eso es `worker-on-demand/DOCS/specs/esenciales/02-mercadopago-oauth-webhooks.md`.

## Historias de usuario
- Como trabajador completando el onboarding, quiero que al autorizar mi cuenta de Mercado Pago la app se entere automáticamente y me muestre la confirmación, sin quedar trabado en la pantalla del navegador.

## Criterios de aceptación
- [x] La variable/propiedad `mercadopago.oauth.mobile-redirect-url` está definida en el ambiente de desarrollo/docker-compose del backend — apuntando a `http://localhost:8081/oauth/mercadopago/callback` (target web, decisión 2026-09-08), no al esquema nativo `workerondemand://` (ver nota de alcance arriba).
- [x] `.env.example` del backend documenta esta variable (`MERCADOPAGO_MOBILE_REDIRECT_URL`), junto a las otras de Mercado Pago.
- [x] Verificado con un click real desde `MercadoPagoLinkStep`: el redirect sale con la URL/`state` correctos hacia Mercado Pago real.
- [ ] No verificado con una autorización real completa (necesita credenciales de sandbox de Mercado Pago reales, que no están disponibles en este ambiente) ni el camino de rechazo/cancelación del lado de MP.

## Superficie funcional necesaria
- Ningún endpoint ni pantalla nueva — es 100% configuración. El único cambio de código posible es documentar la variable en `.env.example` del backend.

## Dependencias
- Ninguna — es la corrección más barata y aislada de todo el roadmap combinado (backend + frontend).

## Decisiones técnicas pendientes (para vos)
- Confirmar el valor exacto que debería tener `MERCADOPAGO_REDIRECT_URI` (el callback del backend) vs. `mercadopago.oauth.mobile-redirect-url` (a dónde redirige el backend después) en cada ambiente (local, staging, producción) — son dos URLs distintas con propósitos distintos, fácil de confundir.
- Si en producción el esquema de deep link (`workerondemand://`) necesita algo adicional (universal links/app links) para andar bien en todos los dispositivos — está fuera del alcance de esta spec puntual pero vale la pena anotarlo para cuando se prepare el primer release real.
