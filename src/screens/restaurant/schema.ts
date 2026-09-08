import { z } from 'zod';
import { WORKER_SKILLS } from '../../constants/skills';

const skillValues = WORKER_SKILLS.map((skill) => skill.value) as [string, ...string[]];

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

// `baseAmount`/`appFee` van en pesos enteros (sin decimales) para simplificar el input — el
// backend los persiste como DECIMAL(10,2), un entero es un subconjunto válido.
export const createShiftSchema = z.object({
  requiredSkill: z.enum(skillValues),
  baseAmount: z.coerce.number().positive('Ingresá un monto válido'),
  date: z.string().regex(dateRegex, 'Formato AAAA-MM-DD'),
  startTime: z.string().regex(timeRegex, 'Formato HH:mm'),
  endTime: z.string().regex(timeRegex, 'Formato HH:mm'),
  shiftLat: z.coerce.number().min(-90, 'Latitud inválida').max(90, 'Latitud inválida'),
  shiftLng: z.coerce.number().min(-180, 'Longitud inválida').max(180, 'Longitud inválida'),
});

export type CreateShiftValues = z.infer<typeof createShiftSchema>;
