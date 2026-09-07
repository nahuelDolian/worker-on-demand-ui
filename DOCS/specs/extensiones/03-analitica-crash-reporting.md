# Spec: Analítica y Crash Reporting

**Categoría:** 🟦 Extensión · **Gap origen:** nuevo — no hay ningún tipo de instrumentación hoy

## Contexto
Sin esto, un crash o un error en producción no le llega a nadie salvo que el propio trabajador lo reporte manualmente. Tampoco hay forma de saber, por ejemplo, en qué paso del onboarding abandona la mayoría de la gente.

## Objetivo
Saber cuándo la app crashea en producción (con stack trace y contexto), y tener visibilidad básica de uso (ej. tasa de completitud del onboarding, paso donde más se abandona).

## Fuera de alcance
- Analítica de negocio profunda (eso es más terreno del backend/BI) — esto es sobre la salud técnica y el uso básico de la app.

## Historias de usuario (marco de developer experience / producto)
- Como equipo, quiero enterarme automáticamente cuando la app crashea para un usuario real, con suficiente contexto para poder reproducir el problema.
- Como equipo de producto, quiero saber en qué paso del onboarding la gente abandona más, para poder priorizar mejoras ahí.

## Criterios de aceptación
- [ ] Un crash no manejado en producción genera un reporte accesible para el equipo, con stack trace y contexto básico (versión de la app, dispositivo, paso en el que estaba el usuario si aplica).
- [ ] Se registran eventos clave del funnel de onboarding (inicio, cada paso completado, abandono si es detectable).
- [ ] La instrumentación no captura datos sensibles (DNI, selfies, tokens) en los eventos o reportes.

## Superficie funcional necesaria
- Integración de una librería de crash reporting.
- Instrumentación de eventos clave en los puntos de transición del onboarding y de check-in/check-out.

## Dependencias
- Ninguna dura — se puede sumar en cualquier momento, aunque conviene tenerlo antes del primer release real para no perder visibilidad desde el día uno.

## Decisiones técnicas pendientes (para vos)
- Proveedor: Sentry (uno de los más usados en el ecosistema Expo/RN, con soporte nativo para source maps) vs. otro.
- Proveedor de analítica de producto (si se decide separarlo del crash reporting): Amplitude, Mixpanel, PostHog, u otro — y si además se quiere combinar con analítica del lado backend en algún momento.
