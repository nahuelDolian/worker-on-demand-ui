import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SkillEmojiAdminScreen } from '../SkillEmojiAdminScreen';
import * as skillEmojisApi from '../../../api/skillEmojisApi';

jest.mock('../../../api/skillEmojisApi');

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// extensiones/08-emojis-configurables-por-skill.md: pantalla admin acotada a editar el emoji de
// las 4 skills existentes — no agrega/quita skills (eso es 04-configuracion-plataforma.md).
describe('SkillEmojiAdminScreen', () => {
  beforeEach(() => {
    jest.mocked(skillEmojisApi.getSkillEmojis).mockResolvedValue([
      { skillCode: 'MOZO_BANDEJA', emoji: '🍽️' },
      { skillCode: 'BACHERO', emoji: '🧽' },
      { skillCode: 'COCINERO', emoji: '🧑‍🍳' },
      { skillCode: 'BARISTA', emoji: '☕' },
    ]);
  });

  it('lists the 4 skills with their current emoji', async () => {
    renderWithQueryClient(<SkillEmojiAdminScreen />);

    // Mismo estilo que SkillChip.test.tsx: elemento por accessibilityLabel, valor por `.props`.
    expect((await screen.findByLabelText('Emoji de Barista')).props.value).toBe('☕');
    expect(screen.getByLabelText('Emoji de Mozo bandeja').props.value).toBe('🍽️');
    expect(screen.getByLabelText('Emoji de Bachero').props.value).toBe('🧽');
    expect(screen.getByLabelText('Emoji de Cocinero').props.value).toBe('🧑‍🍳');
  });

  it('saves an edited emoji for a skill', async () => {
    jest.mocked(skillEmojisApi.updateSkillEmoji).mockResolvedValue({ skillCode: 'BARISTA', emoji: '🫖' });
    renderWithQueryClient(<SkillEmojiAdminScreen />);

    const input = await screen.findByLabelText('Emoji de Barista');
    fireEvent.changeText(input, '🫖');
    fireEvent.press(screen.getByLabelText('Guardar emoji de Barista'));

    await waitFor(() => expect(skillEmojisApi.updateSkillEmoji).toHaveBeenCalledWith('BARISTA', '🫖'));
  });
});
