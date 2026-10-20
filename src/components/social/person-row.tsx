import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Palette, Spacing } from '@/constants/theme';

/** One person in a Social list: avatar, @username, optional note, then actions. */
export function PersonRow({
  username,
  avatarUrl,
  note,
  children,
}: {
  username: string;
  avatarUrl: string | null;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Avatar url={avatarUrl} />
      <View style={styles.text}>
        <ThemedText type="control" numberOfLines={1}>
          @{username}
        </ThemedText>
        {note && (
          <ThemedText type="metadata" themeColor="textSecondary" numberOfLines={1}>
            {note}
          </ThemedText>
        )}
      </View>
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

export function Avatar({ url, size = 40 }: { url: string | null; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Icon name="account" size={size * 0.7} color={Palette.purpleInk} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 44,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
