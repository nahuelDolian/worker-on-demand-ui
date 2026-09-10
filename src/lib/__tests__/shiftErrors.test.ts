import { describeSelectWorkerErrorCode } from '../shiftErrors';

// Issue #17 (bug real): selectWorker devuelve un codigo de error propio (no el 409 generico de
// worker_has_active_shift, que esta redactado desde la perspectiva del worker postulandose) para
// que la UI del restaurante muestre un mensaje que tenga sentido desde SU perspectiva.
describe('describeSelectWorkerErrorCode', () => {
  it('explains that the candidate was already taken elsewhere', () => {
    expect(describeSelectWorkerErrorCode('worker_already_matched_elsewhere')).toBe(
      'Este trabajador ya fue tomado en otro turno — elegí otro postulante.'
    );
  });

  it('falls back to a generic message for unknown codes', () => {
    expect(describeSelectWorkerErrorCode('http_500')).toBe('No pudimos confirmar al trabajador. Intentá de nuevo.');
  });
});
