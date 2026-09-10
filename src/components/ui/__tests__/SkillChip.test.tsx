import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SkillChip } from '../SkillChip';

// Smoke test de la infraestructura de Jest + Testing Library (recién agregada) sobre un
// componente RN real, no solo TS puro (ver cuit.test.ts) — confirma que el pipeline de
// renderizado funciona antes de apoyar en él las specs #1/#3/#4.
describe('SkillChip', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<SkillChip label="Mozo" selected={false} onPress={onPress} />);

    fireEvent.press(screen.getByLabelText('Mozo'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reflects the selected state via accessibilityState', () => {
    render(<SkillChip label="Mozo" selected onPress={jest.fn()} />);

    expect(screen.getByLabelText('Mozo').props.accessibilityState).toEqual({ checked: true });
  });
});
