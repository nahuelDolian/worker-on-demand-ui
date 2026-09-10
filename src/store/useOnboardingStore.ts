import { create } from 'zustand';
import type { IdentityUploadValues } from '../screens/onboarding/schema';

/**
 * El paso de datos personales (antes `personal-info`) ahora es el registro, y vive en el flujo de
 * auth (`(auth)/register` → `authApi.registerWorker`) — no deja logueado, así que no tiene sentido
 * seguir guardándolo acá. Este store quedó solo con los dos pasos que corren autenticados, después
 * del login: verificación de identidad y vínculo de Mercado Pago. El `workerId` que antes devolvía
 * el registro ahora sale de la sesión (`useSessionStore`).
 *
 * Nota de alcance: no hay, todavía, ninguna señal del backend de "identidad ya subida" / "MP ya
 * vinculado" (no hay esos campos en `UserResponse`) — persistir/retomar este progreso entre
 * aperturas de la app es expresamente lo que resuelve `esenciales/04-persistencia-resiliencia-onboarding.md`,
 * no esta spec. Por ahora este estado solo vive en memoria durante la sesión de la app.
 */

interface OnboardingState {
  identityUpload: IdentityUploadValues | null;
  mercadoPagoLinked: boolean;
  setIdentityUpload: (values: IdentityUploadValues) => void;
  setMercadoPagoLinked: (linked: boolean) => void;
  reset: () => void;
}

const initialState = {
  identityUpload: null,
  mercadoPagoLinked: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setIdentityUpload: (values) => set({ identityUpload: values }),
  setMercadoPagoLinked: (linked) => set({ mercadoPagoLinked: linked }),
  reset: () => set(initialState),
}));
