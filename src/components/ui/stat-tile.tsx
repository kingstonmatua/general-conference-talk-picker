import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { Palette, SessionTagColors, Spacing } from '@/constants/theme';

/**
 * Brand board §06 — "Completed: sage + check + 'Studied'. Streak:
 * terracotta + flame + day count. Saved: lavender + filled bookmark +
 * 'Saved'." Same semantic-color logic as session tags, applied to a
 * stat/summary tile instead.
 */
export function StatTile({
  icon,
  color,
  value,
  label,
}: {
  icon: AppIconName;
  color: keyof typeof SessionTagColors;
  value: string;
  label: string;
}) {
  const { bg, text } = SessionTagColors[color];
  return (
    <Card style={styles.card}>
      <View style={[styles.iconBadge, { backgroundColor: bg }]}>
        <Icon name={icon} size={20} color={text} />
      </View>
      <View style={styles.copy}>
        <ThemedText type="display" style={styles.value}>
          {value}
        </ThemedText>
        <ThemedText type="metadata" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    minWidth: 160,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 0,
  },
  value: {
    fontSize: 26,
    lineHeight: 30,
    color: Palette.purpleInk,
  },
});
