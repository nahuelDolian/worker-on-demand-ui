# Spec: Accesibilidad Avanzada

**Categoría:** 🟦 Extensión · **Gap origen:** nuevo — la base ya es buena, esto es formalizarla y extenderla

## Contexto
A diferencia de la mayoría de los gaps de este documento, acá el punto de partida ya es sólido: todos los componentes de `src/components/ui/` y las pantallas relevadas usan `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` y `accessibilityState` de forma consistente (`FormTextField`, `PrimaryButton`, `SkillChip`, `StepProgressBar`, `CheckStatusPanel` — todos con anotaciones correctas). Esto no es algo que se ve típicamente sin haberlo hecho a propósito.

## Objetivo
Formalizar esta buena práctica ya existente: verificarla con herramientas reales (no solo revisión visual del código), extenderla a las pantallas nuevas que se construyan, y probarla con lectores de pantalla reales (VoiceOver/TalkBack), no solo con las propiedades bien puestas en el JSX.

## Historias de usuario
- Como trabajador que usa un lector de pantalla, quiero poder completar el onboarding y el check-in de punta a punta sin asistencia.
- Como equipo, quiero que cada pantalla nueva mantenga el mismo estándar de accesibilidad que ya tienen las existentes, no que se pierda con el tiempo.

## Criterios de aceptación
- [ ] Se verifica manualmente (VoiceOver en iOS, TalkBack en Android) que el flujo de onboarding completo es navegable y entendible con lector de pantalla.
- [ ] Se agrega una convención/checklist de accesibilidad al proceso de desarrollo (ej. como parte de la revisión de cada Pull Request) para que las pantallas nuevas mantengan el estándar.
- [ ] Se verifican los contrastes de color (relevante también para `extensiones/02-modo-oscuro.md`) contra los mínimos de WCAG.

## Superficie funcional necesaria
No aplica — es proceso y verificación sobre lo que ya existe, no una feature nueva de código en sí (salvo los ajustes puntuales que la verificación real encuentre).

## Dependencias
- Ninguna — se puede hacer sobre lo que ya existe hoy mismo.

## Decisiones técnicas pendientes (para vos)
- Si se automatiza algo de esto (ej. `eslint-plugin-jsx-a11y` adaptado a React Native, o herramientas de testing de accesibilidad) como parte de `esenciales/07-testing-linting-frontend.md`, o queda como proceso manual de revisión.
