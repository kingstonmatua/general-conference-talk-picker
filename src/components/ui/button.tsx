import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Palette, Radii, Spacing } from '@/constants/theme';

/**
 * Brand board §05 — "One primary action per view. Pressed: gold-ink
 * border. Focus: 2 px purple ring with 2 px gap. Disabled: muted label +
 * explicit unavailable state."
 *
 * The board's own example art (§05) shows the primary action as a filled
 * champagne pill with dark ink text, and the secondary action as a
 * purple-outlined pill — NOT the solid deep-purple button shown in the
 * rough ChatGPT mockups. Per the board's own framing ("this board
 * supersedes V1 interface styling... rules, not a frozen screen"), this
 * implementation follows the board's explicit example over the mockups.
 * Flag to revisit if the purple-CTA look from the mockups is preferred.
 */
export type ButtonVariant = 'primary' | 'secondary';

type Props = PressableProps & {
  label: string;
  variant?: ButtonVariant;
};

export function Button({ label, variant = 'primary', style, disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        state.pressed && !disabled && (variant === 'primary' ? styles.primaryPressed : styles.secondaryPressed),
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <ThemedText
        type="control"
        themeColor={variant === 'primary' ? undefined : 'text'}
        style={variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.xl,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: Palette.champagne,
  },
  primaryPressed: {
    borderWidth: 2,
    borderColor: Palette.goldInk,
  },
  primaryLabel: {
    color: Palette.purpleInk,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Palette.conferencePurple,
  },
  secondaryPressed: {
    borderWidth: 2,
    borderColor: Palette.goldInk,
  },
  secondaryLabel: {
    color: Palette.conferencePurple,
  },
  disabled: {
    opacity: 0.45,
  },
});
