import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radii, Spacing } from '@/constants/theme';

/**
 * Generic filter pill — used for session-category filters (Browse),
 * progress-scope options (Progress), and saved-status filters (Saved).
 * Brand board tags are "fully rounded"; this follows the same shape but
 * as an interactive filter control rather than a static label.
 */
export function Pill({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: { bg: string; text: string };
}) {
  const bg = selected ? (color?.bg ?? Palette.purpleInk) : Palette.surface;
  const text = selected ? (color?.text ?? '#FFFFFF') : Palette.secondaryInk;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      <ThemedText
        type="control"
        style={[
          styles.pill,
          { backgroundColor: bg, color: text, borderColor: selected ? bg : Palette.warmBorder },
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: Radii.tag,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    overflow: 'hidden',
  },
});
