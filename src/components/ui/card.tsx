import { StyleSheet, View, type ViewProps } from 'react-native';

import { Palette, Radii, Spacing } from '@/constants/theme';

/**
 * Brand board §03 — "Cards: 1 px warm border, 12 px radius... Default
 * shadow: none; overlays only, 0 4 16 at 6% ink."
 */
export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    borderRadius: Radii.card,
    padding: Spacing.lg,
  },
});
