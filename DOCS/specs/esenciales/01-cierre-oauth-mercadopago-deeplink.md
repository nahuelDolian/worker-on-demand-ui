# Spec: Cierre del flujo OAuth de Mercado Pago (deep link end-to-end)

**Categoría:** 🟩 Esencial · **Gap origen:** hallazgo nuevo de este relevamiento, `DOCS/ROADMAP.md` §2 de este repo
**Estado actual:** Roto de punta a punta por un gap de configuración, no de código. Ambos lados (`MercadoPagoLinkStep.tsx` acá, `MercadoPagoOAuthController`/`MercadoPagoOAuthProperties` en el backend) están bien implementados, pero la propiedad que los conecta (`mercadopago.oauth.mobile-redirect-url`) nunca se setea.

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
- [ ] La variable/propiedad `mercadopago.oauth.mobile-redirect-url` (o su equivalente vía variable de entorno) está definida en al menos el ambiente de desarrollo/docker-compose del backend, apuntando al esquema correcto (`workerondemand://oauth/mercadopago/callback`, coincidiendo con `app.json` → `"scheme": "workerondemand"` y `MERCADOPAGO_MOBILE_REDIRECT_PATH`).
- [ ] `.env.example` del backend documenta esta variable (hoy no la incluye, y debería, junto a las otras 4 de Mercado Pago).
- [ ] Al completar la autorización real (o simulada en un entorno de prueba de Mercado Pago), `MercadoPagoLinkStep` recibe `result.type === 'success'` y muestra la confirmación de vínculo.
- [ ] Un rechazo o cancelación del lado de Mercado Pago también se refleja correctamente en la app (ya hay manejo de `status=error` en el código — verificar que efectivamente se ejercite con esta configuración corregida).

## Superficie funcional necesaria
- Ningún endpoint ni pantalla nueva — es 100% configuración. El único cambio de código posible es documentar la variable en `.env.example` del backend.

## Dependencias
- Ninguna — es la corrección más barata y aislada de todo el roadmap combinado (backend + frontend).

## Decisiones técnicas pendientes (para vos)
- Confirmar el valor exacto que debería tener `MERCADOPAGO_REDIRECT_URI` (el callback del backend) vs. `mercadopago.oauth.mobile-redirect-url` (a dónde redirige el backend después) en cada ambiente (local, staging, producción) — son dos URLs distintas con propósitos distintos, fácil de confundir.
- Si en producción el esquema de deep link (`workerondemand://`) necesita algo adicional (universal links/app links) para andar bien en todos los dispositivos — está fuera del alcance de esta spec puntual pero vale la pena anotarlo para cuando se prepare el primer release real.
