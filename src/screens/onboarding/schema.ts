import { z } from 'zod';
import { isValidCuit, normalizeCuit } from '../../lib/cuit';
import { WORKER_SKILLS } from '../../constants/skills';

const skillValues = WORKER_SKILLS.map((skill) => skill.value) as [string, ...string[]];

export const personalInfoSchema = z.object({
  fullName: z.string().trim().min(3, 'Ingresá tu nombre completo'),
  email: z.string().trim().email('Ingresá un email válido'),
  cuitCuil: z
    .string()
    .transform(normalizeCuit)
    .refine((value) => value.length === 11, 'El CUIT/CUIL debe tener 11 dígitos')
    .refine(isValidCuit, 'El CUIT/CUIL ingresado no es válido'),
  skills: z.array(z.enum(skillValues)).min(1, 'Seleccioná al menos una micro-habilidad'),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

export const identityUploadSchema = z.object({
  dniFrontUri: z.string().min(1, 'Falta la foto del frente del DNI'),
  dniBackUri: z.string().min(1, 'Falta la foto del dorso del DNI'),
  selfieUri: z.string().min(1, 'Falta la selfie'),
});

export type IdentityUploadValues = z.infer<typeof identityUploadSchema>;
