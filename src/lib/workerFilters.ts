import type { ShiftResponseDto } from '../api/restaurantApi';

/**
 * esenciales/04-app-worker-marketplace-turnos.md, segunda vuelta: el filtro de skill en "Turnos"
 * defaultea a la primera skill propia del worker (`GET /api/workers/me`) en vez de "Todas" — un
 * worker con más de una skill puede seguir cambiando el filtro a mano.
 */
export function defaultSkillFilter(skills: string[]): string | null {
  return skills[0] ?? null;
}

/**
 * "Mis postulaciones pendientes": une BROADCASTING (`mine=true`) + SELECTION_PENDING, sin
 * duplicar un turno que por alguna razón apareciera en ambas listas, ordenado por `startTime`.
 */
export function mergePendingApplications(
  broadcasting: ShiftResponseDto[],
  selectionPending: ShiftResponseDto[]
): ShiftResponseDto[] {
  const byId = new Map<string, ShiftResponseDto>();
  for (const shift of [...broadcasting, ...selectionPending]) {
    byId.set(shift.id, shift);
  }
  return [...byId.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
}
