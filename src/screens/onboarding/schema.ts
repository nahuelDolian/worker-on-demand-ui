import { z } from 'zod';
import { isValidCuit, normalizeCuit } from '../../lib/cuit';
import { WORKER_SKILLS } from '../../constants/skills';

const skillValues = WORKER_SKILLS.map((skill) => skill.value) as [string, ...string[]];

// Backend (spec 01): único requisito de complejidad hoy es mínimo 8 caracteres.
export const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres');

// Compartido entre el registro de worker y el de restaurante (`POST /api/workers` /
// `POST /api/restaurants` — mismos 4 campos base, el worker suma `skills`).
const baseRegisterFields = {
  fullName: z.string().trim().min(3, 'Ingresá tu nombre completo'),
  email: z.string().trim().email('Ingresá un email válido'),
  cuitCuil: z
    .string()
    .transform(normalizeCuit)
    .refine((value) => value.length === 11, 'El CUIT/CUIL debe tener 11 dígitos')
    .refine(isValidCuit, 'El CUIT/CUIL ingresado no es válido'),
  password: passwordSchema,
};

export const personalInfoSchema = z.object({
  ...baseRegisterFields,
  skills: z.array(z.enum(skillValues)).min(1, 'Seleccioná al menos una micro-habilidad'),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

export const restaurantRegisterSchema = z.object(baseRegisterFields);

export type RestaurantRegisterValues = z.infer<typeof restaurantRegisterSchema>;

export const identityUploadSchema = z.object({
  dniFrontUri: z.string().min(1, 'Falta la foto del frente del DNI'),
  dniBackUri: z.string().min(1, 'Falta la foto del dorso del DNI'),
  selfieUri: z.string().min(1, 'Falta la selfie'),
});

export type IdentityUploadValues = z.infer<typeof identityUploadSchema>;

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'El código tiene 6 dígitos')
    .regex(/^\d{6}$/, 'El código solo tiene números'),
});

export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Ingresá un email válido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

export type LoginValues = z.infer<typeof loginSchema>;
