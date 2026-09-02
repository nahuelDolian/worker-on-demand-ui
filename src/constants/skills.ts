export const WORKER_SKILLS = [
  { value: 'MOZO_BANDEJA', label: 'Mozo bandeja' },
  { value: 'BACHERO', label: 'Bachero' },
  { value: 'COCINERO', label: 'Cocinero' },
  { value: 'BARISTA', label: 'Barista' },
] as const;

export type SkillValue = (typeof WORKER_SKILLS)[number]['value'];
