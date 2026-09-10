# Spec: Protección del Build de Producción

**Categoría:** 🟨 Seguridad · **Gap origen:** nuevo, relevante recién antes del primer release público

## Contexto
Hoy no hay ninguna consideración sobre qué termina empaquetado en un build de producción: variables de entorno, logs de debug, o configuración pensada para desarrollo que no debería llegar a un build real.

## Objetivo
Antes del primer build para las stores, asegurar que no se filtre nada sensible ni quede configuración de desarrollo activa.

## Fuera de alcance
- Certificate pinning u otras protecciones de red avanzadas — evaluar si el nivel de riesgo del producto lo justifica; no es parte del mínimo de esta spec.

## Historias de usuario (marco de seguridad)
- Como plataforma, quiero que un build de producción no incluya URLs de desarrollo, logs verbosos, ni ningún dato que no debería estar ahí.

## Criterios de aceptación
- [ ] `EXPO_PUBLIC_API_BASE_URL` (y cualquier variable equivalente) apunta al backend de producción en un build de producción, no al default de `localhost`.
- [ ] No quedan `console.log` con datos sensibles (tokens, datos personales) en el código que llega a producción — el linter (`esenciales/07`) puede ayudar a atrapar esto.
- [ ] Se revisa qué permisos declarados en `app.json` son realmente necesarios (hoy: `CAMERA`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` — todos justificados por features reales, mantenerlo así, no agregar de más).

## Superficie funcional necesaria
No aplica — es una checklist de proceso de release, no una feature de código.

## Dependencias
- Se beneficia de `esenciales/08-cicd-configuracion-build.md` (donde vive la configuración de builds por ambiente).

## Decisiones técnicas pendientes (para vos)
- Si se adopta algún linter/regla específica para detectar `console.log` accidentales, o queda como revisión manual antes de cada release.
- Si en algún momento se justifica certificate pinning dado el volumen de dinero que maneja indirectamente la plataforma (a través del backend) — es una decisión de apetito de riesgo, no puramente técnica.
