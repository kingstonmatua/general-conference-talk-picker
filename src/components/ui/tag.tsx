import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, SessionTagColors, Spacing, type SessionCategory, SessionCategoryTag } from '@/constants/theme';

/**
 * Brand board §03/§06 — tags are fully rounded, dark ink on a pastel fill.
 * Colors are a semantic *family*, intentionally shared across categories
 * (see locked session-taxonomy mapping) — not unique per-category IDs.
 */
export function SessionTag({ category }: { category: SessionCategory }) {
  const { label, color } = SessionCategoryTag[category];
  return <Tag label={label} color={color} />;
}

export function Tag({ label, color }: { label: string; color: keyof typeof SessionTagColors }) {
  const { bg, text } = SessionTagColors[color];
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <ThemedText type="metadata" style={[styles.label, { color: text }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: Radii.tag,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
  },
});
