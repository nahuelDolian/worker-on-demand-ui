# Spec: Perfil de Trabajador Editable

**Categoría:** 🟦 Extensión · **Gap origen:** nuevo — no hay ninguna pantalla para ver o editar el perfil después del onboarding

## Contexto
Hoy, una vez completado el onboarding, no hay forma de que un trabajador vea sus propios datos, cambie sus micro-skills, o actualice su foto de perfil. Todo lo que se cargó en el onboarding queda "congelado" desde la perspectiva de la app.

## Objetivo
Una pantalla donde el trabajador pueda ver su información y editar lo que tenga sentido que sea editable sin volver a pasar por verificación (ej. skills), distinguiéndolo de lo que si se cambia debería re-disparar verificación (ej. una foto de DNI nueva).

## Fuera de alcance
- Cambiar el CUIT/CUIL o el email (probablemente requiera un flujo de verificación aparte, no un simple editar-y-guardar) — a definir si entra acá o es su propia spec más adelante.

## Historias de usuario
- Como trabajador, quiero ver mis datos personales y mis micro-skills actuales.
- Como trabajador, quiero poder agregar o quitar micro-skills sin tener que volver a verificar mi identidad.
- Como trabajador, quiero ver el estado de mi verificación de identidad (si está pendiente, aprobada, o necesita algo de mi parte).

## Reglas de negocio a definir
1. ¿Qué campos son editables libremente y cuáles requieren algún tipo de revalidación?
2. ¿Cambiar las skills afecta turnos ya postulados/asignados, o solo aplica hacia adelante?

## Criterios de aceptación
- [ ] Un trabajador autenticado puede ver sus datos y skills actuales.
- [ ] Puede editar sus skills y el cambio se refleja en el backend.
- [ ] Puede ver el estado de su verificación de identidad.

## Superficie funcional necesaria
- Backend: probablemente falte un endpoint de "actualizar mi perfil" más allá del registro inicial (a confirmar contra el backend, no estaba en el alcance de los specs ya escritos ahí).

## Dependencias
- Depende de `esenciales/02-navegacion-y-enrutamiento.md` y `esenciales/03-autenticacion-cliente.md`.

## Decisiones técnicas pendientes (para vos)
- Si esto amerita un endpoint nuevo de backend (no cubierto en los specs ya escritos de `worker-on-demand/DOCS/specs/`) — anotar como gap a sumar ahí si se decide construir esta spec.
