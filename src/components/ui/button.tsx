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
export type ButtonVariant = 'primary' | 'secondary' | 'accent';

type Props = PressableProps & {
  label: string;
  variant?: ButtonVariant;
};

export function Button({ label, variant = 'primary', style, disabled, ...rest }: Props) {
  const v = VARIANT_STYLES[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.base,
        v.container,
        state.pressed && !disabled && v.containerPressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <ThemedText type="control" style={v.label}>
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
  primaryLabel: {
    color: Palette.purpleInk,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Palette.conferencePurple,
  },
  secondaryLabel: {
    color: Palette.conferencePurple,
  },
  // Solid purple fill + white text — not part of the brand board's own
  // example art (that shows champagne/purple-outline only), added for a
  // specific case that explicitly wanted this exact look.
  accent: {
    backgroundColor: Palette.purpleInk,
  },
  accentLabel: {
    color: '#FFFFFF',
  },
  pressedGoldBorder: {
    borderWidth: 2,
    borderColor: Palette.goldInk,
  },
  disabled: {
    opacity: 0.45,
  },
});

const VARIANT_STYLES: Record<ButtonVariant, { container: object; containerPressed: object; label: object }> = {
  primary: { container: styles.primary, containerPressed: styles.pressedGoldBorder, label: styles.primaryLabel },
  secondary: { container: styles.secondary, containerPressed: styles.pressedGoldBorder, label: styles.secondaryLabel },
  accent: { container: styles.accent, containerPressed: styles.pressedGoldBorder, label: styles.accentLabel },
};
