import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { SessionTag } from '@/components/ui/tag';
import { Palette, Spacing, type SessionCategory } from '@/constants/theme';

/**
 * Brand board §05 — "Card order: session → title → speaker/date → status →
 * action. Title wraps naturally."
 */
export function TalkCard({
  category,
  title,
  meta,
  progressPercent,
  statusLabel,
  actionLabel,
}: {
  category: SessionCategory;
  title: string;
  meta: string;
  progressPercent?: number;
  statusLabel?: string;
  actionLabel: string;
}) {
  return (
    <Card style={styles.card}>
      <SessionTag category={category} />
      <ThemedText type="section">{title}</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {meta}
      </ThemedText>

      {typeof progressPercent === 'number' && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      )}

      <View style={styles.footer}>
        {statusLabel ? (
          <ThemedText type="metadata" themeColor="textSecondary">
            {statusLabel}
          </ThemedText>
        ) : (
          <View />
        )}
        <ThemedText type="control" style={styles.action}>
          {actionLabel}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.warmBorder,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.champagne,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  action: {
    color: Palette.conferencePurple,
  },
});
