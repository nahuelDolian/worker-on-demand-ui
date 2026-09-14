import { apiFetch } from './httpClient';
import type { SkillEmojiDto } from '../lib/skillEmojis';

/** `GET /api/skill-emojis` — público, sin credencial, mismo criterio que `getPlatformCommission`. */
export async function getSkillEmojis(): Promise<SkillEmojiDto[]> {
  return apiFetch<SkillEmojiDto[]>('/api/skill-emojis');
}

/** `PUT /api/admin/skill-emojis/{skillCode}` — ADMIN. 400 si `skillCode` no es una skill válida. */
export async function updateSkillEmoji(skillCode: string, emoji: string): Promise<SkillEmojiDto> {
  return apiFetch<SkillEmojiDto>(`/api/admin/skill-emojis/${skillCode}`, {
    method: 'PUT',
    body: { emoji },
  });
}
