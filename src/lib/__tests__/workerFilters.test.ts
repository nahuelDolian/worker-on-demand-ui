import { defaultSkillFilter, mergePendingApplications } from '../workerFilters';
import type { ShiftResponseDto } from '../../api/restaurantApi';

function aShift(overrides: Partial<ShiftResponseDto> & Pick<ShiftResponseDto, 'id'>): ShiftResponseDto {
  return {
    restaurantId: 'r1',
    workerId: null,
    requiredSkill: 'MOZO_BANDEJA',
    status: 'BROADCASTING',
    baseAmount: 1000,
    appFee: 100,
    startTime: '2026-09-10T18:00:00Z',
    endTime: '2026-09-10T23:00:00Z',
    shiftLat: -34.6,
    shiftLng: -58.4,
    shiftAddress: null,
    shiftPlaceId: null,
    mpPreauthId: null,
    cancellationPenaltyPreview: null,
    ...overrides,
  };
}

// esenciales/04-app-worker-marketplace-turnos.md, segunda vuelta: el filtro de "Turnos" no
// defaulteaba a las skills propias del worker porque no había forma de leerlas post-login
// (GET /api/workers/me, ya resuelto). Función pura para no depender de renderizar
// BrowseShiftsScreen completo (expo-location + TanStack Query) solo para esto.
describe('defaultSkillFilter', () => {
  it('defaults to the worker\'s first skill when they have one or more', () => {
    expect(defaultSkillFilter(['BACHERO', 'COCINERO'])).toBe('BACHERO');
  });

  it('falls back to "todas" (null) when the worker has no skills yet', () => {
    expect(defaultSkillFilter([])).toBeNull();
  });
});

// "Mis postulaciones pendientes": BROADCASTING (mine=true) + SELECTION_PENDING combinados,
// sin duplicados y ordenados por fecha de inicio.
describe('mergePendingApplications', () => {
  it('combines both lists sorted by startTime, without duplicates', () => {
    const broadcasting = [aShift({ id: 'b1', startTime: '2026-09-12T10:00:00Z' })];
    const selectionPending = [aShift({ id: 's1', status: 'SELECTION_PENDING', startTime: '2026-09-11T10:00:00Z' })];

    const result = mergePendingApplications(broadcasting, selectionPending);

    expect(result.map((s) => s.id)).toEqual(['s1', 'b1']);
  });

  it('deduplicates a shift id present in both lists', () => {
    const shift = aShift({ id: 'dup', status: 'SELECTION_PENDING' });

    const result = mergePendingApplications([shift], [shift]);

    expect(result.map((s) => s.id)).toEqual(['dup']);
  });
});
