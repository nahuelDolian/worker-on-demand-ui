import { resolveSkillEmoji } from '../skillEmojis';

// extensiones/08-emojis-configurables-por-skill.md: fallback sin crashear si GET /api/skill-emojis
// todavía no resolvió o no tiene fila para esa skill — SkillChip/ShiftCard caen a mostrar solo el
// label de texto en esos casos.
describe('resolveSkillEmoji', () => {
  it('returns the emoji for a matching skillCode', () => {
    const emojis = [
      { skillCode: 'BARISTA', emoji: '☕' },
      { skillCode: 'COCINERO', emoji: '🧑‍🍳' },
    ];

    expect(resolveSkillEmoji('BARISTA', emojis)).toBe('☕');
  });

  it('returns undefined when the list has not loaded yet', () => {
    expect(resolveSkillEmoji('BARISTA', undefined)).toBeUndefined();
  });

  it('returns undefined when the skillCode has no configured emoji', () => {
    expect(resolveSkillEmoji('BARISTA', [])).toBeUndefined();
  });
});
