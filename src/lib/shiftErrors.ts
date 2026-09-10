/**
 * Issue #17 (bug real, 2026-09-09): `selectWorker` puede fallar con un código de error propio,
 * distinto de `worker_has_active_shift` — ese está redactado desde la perspectiva del WORKER
 * postulándose; `worker_already_matched_elsewhere` es el RESTAURANT eligiendo a alguien que ya
 * no está disponible (dos restaurantes lo eligieron casi a la vez).
 */
export function describeSelectWorkerErrorCode(code: string): string {
  switch (code) {
    case 'worker_already_matched_elsewhere':
      return 'Este trabajador ya fue tomado en otro turno — elegí otro postulante.';
    default:
      return 'No pudimos confirmar al trabajador. Intentá de nuevo.';
  }
}
