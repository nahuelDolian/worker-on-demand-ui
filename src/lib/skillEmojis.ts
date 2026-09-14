export interface SkillEmojiDto {
  skillCode: string;
  emoji: string;
}

/**
 * extensiones/08-emojis-configurables-por-skill.md: resuelve el emoji de una skill contra la
 * lista que devuelve `GET /api/skill-emojis` — `undefined` (nunca crashea) si la lista todavía no
 * resolvió o no tiene fila para esa skill; los llamadores caen a mostrar solo el label de texto.
 */
export function resolveSkillEmoji(skillCode: string, emojis: SkillEmojiDto[] | undefined): string | undefined {
  return emojis?.find((entry) => entry.skillCode === skillCode)?.emoji;
}
