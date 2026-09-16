import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { SessionTag } from '@/components/ui/tag';
import { Palette, Spacing, type SessionCategory } from '@/constants/theme';

/**
 * Brand board §05 — "Card order: session → title → speaker/date → status →
 * action. Title wraps naturally." §06 — "Saved: lavender + filled bookmark
 * + 'Saved'."
 */
export function TalkCard({
  category,
  title,
  meta,
  progressPercent,
  statusLabel,
  actionLabel,
  onPressAction,
  favorite,
  onToggleFavorite,
  onPress,
}: {
  category: SessionCategory;
  title: string;
  meta: string;
  progressPercent?: number;
  statusLabel?: string;
  actionLabel?: string;
  /** Makes actionLabel tappable. Omit to render it as a static label. */
  onPressAction?: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** Makes the whole card tappable (e.g. to open the talk's detail screen). */
  onPress?: () => void;
}) {
  const content = (
    <Card style={styles.card}>
      <View style={styles.header}>
        <SessionTag category={category} />
        {typeof favorite === 'boolean' && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            hitSlop={8}>
            <Icon
              name={favorite ? 'savedFilled' : 'saved'}
              size={18}
              color={favorite ? Palette.conferencePurple : Palette.secondaryInk}
            />
          </Pressable>
        )}
      </View>

      <ThemedText type="section">{title}</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {meta}
      </ThemedText>

      {typeof progressPercent === 'number' && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      )}

      {(statusLabel || actionLabel) && (
        <View style={styles.footer}>
          {statusLabel ? (
            <ThemedText type="metadata" themeColor="textSecondary">
              {statusLabel}
            </ThemedText>
          ) : (
            <View />
          )}
          {actionLabel && onPressAction ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onPressAction();
              }}
              hitSlop={8}>
              <ThemedText type="control" style={styles.action}>
                {actionLabel}
              </ThemedText>
            </Pressable>
          ) : (
            actionLabel && (
              <ThemedText type="control" style={styles.action}>
                {actionLabel}
              </ThemedText>
            )
          )}
        </View>
      )}
    </Card>
  );

  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
