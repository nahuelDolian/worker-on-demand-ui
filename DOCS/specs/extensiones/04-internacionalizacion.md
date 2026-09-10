# Spec: Internacionalización (i18n)

**Categoría:** 🟦 Extensión · **Gap origen:** nuevo — hoy todo el texto está hardcodeado en español, sin infraestructura de traducción

## Contexto
El negocio hoy opera en Argentina (`DOCS/SPEC.md` del backend lo dice explícitamente) y todo el texto de la app está en español, escrito directo en cada componente (ej. `"Necesitamos algunos datos para verificar tu identidad como Monotributista."`). Esto es correcto para el alcance actual — esta spec solo aplica si el negocio decide expandirse a otro país/idioma.

## Objetivo
Si y solo si se decide expandir a otro mercado: extraer los strings a un sistema de traducción en vez de tenerlos hardcodeados, sin necesidad de tocar cada componente uno por uno en el futuro.

## Fuera de alcance
- Traducir contenido a un idioma específico — esta spec es sobre la infraestructura, no sobre producir traducciones.
- Adaptaciones más allá del idioma (formato de fecha/moneda, validación de CUIT que es específica de Argentina y no aplicaría a otro país tal cual) — si el negocio se expande, probablemente haya que revisar `cuit.ts` y reglas similares, fuera del alcance de esta spec puntual.

## Criterios de aceptación (si se decide encarar)
- [ ] Los strings de UI están centralizados en archivos de traducción, no hardcodeados en los componentes.
- [ ] Agregar un idioma nuevo no requiere tocar la lógica de cada componente, solo agregar el archivo de traducción correspondiente.

## Decisiones técnicas pendientes (para vos)
- Si esto se prioriza en absoluto — depende 100% de una decisión de negocio (expansión geográfica) que hoy no está sobre la mesa según todo lo demás relevado.
- Librería: `i18next`/`react-i18next` es la opción más común en el ecosistema RN si se decide encarar esto.
