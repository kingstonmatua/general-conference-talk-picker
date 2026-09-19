import { TabList, TabListProps, TabSlot, Tabs, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { Icon, type AppIconName } from './ui/icon';

import { Palette, Spacing } from '@/constants/theme';
import { useDrawRandomTalk } from '@/hooks/use-draw-random-talk';

/**
 * Native nav shell — a floating rounded tab bar with a docked "Draw a
 * Random Talk" button rising out of its center, per the user's reference
 * screenshot (a fitness-app tab bar with the same silhouette). This
 * replaced expo-router/unstable-native-tabs' true OS-native tab bar,
 * which can't be restyled into a floating/rounded shape or take an
 * overlapping center button — its props are limited to colors and
 * label-visibility, not layout. Switched to expo-router/ui's Tabs
 * primitives instead (the same ones app-tabs.web.tsx already uses for
 * the desktop sidebar), which are plain React components and give full
 * layout control at the cost of the OS's own native tab-bar chrome.
 *
 * The draw button is a plain Pressable, not a <TabTrigger> — per a
 * standing decision, "Random Talk" is an action (draw + navigate to the
 * talk), not a fifth nav destination. Exactly four real tabs.
 */
export default function AppTabs() {
  const drawRandomTalk = useDrawRandomTalk();
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={styles.root}>
      <TabSlot />

      <TabList asChild>
        <FloatingBar bottomInset={insets.bottom}>
          <TabTrigger name="home" href="/" asChild>
            <BarItem icon="home">Home</BarItem>
          </TabTrigger>
          <TabTrigger name="browse" href="/browse" asChild>
            <BarItem icon="browse">Browse</BarItem>
          </TabTrigger>

          <Pressable
            onPress={() => drawRandomTalk()}
            hitSlop={8}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
            <Icon name="draw" size={26} color="#FFFFFF" />
          </Pressable>

          <TabTrigger name="progress" href="/progress" asChild>
            <BarItem icon="progress">Progress</BarItem>
          </TabTrigger>
          <TabTrigger name="saved" href="/saved" asChild>
            <BarItem icon="saved">Saved</BarItem>
          </TabTrigger>
        </FloatingBar>
      </TabList>
    </Tabs>
  );
}

function FloatingBar({ bottomInset, ...props }: TabListProps & { bottomInset: number }) {
  return <View {...props} style={[styles.bar, { bottom: bottomInset + Spacing.md }]} />;
}

function BarItem({
  children,
  isFocused,
  icon,
  ...pressableProps
}: TabTriggerSlotProps & { icon: AppIconName }) {
  const color = isFocused ? Palette.purpleInk : Palette.secondaryInk;
  return (
    <Pressable {...pressableProps} style={styles.barItem}>
      <Icon name={icon} size={22} color={color} />
      <ThemedText type="metadata" style={[styles.barItemLabel, { color }]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  bar: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    height: 68,
    borderRadius: 34,
    backgroundColor: Palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
    boxShadow: '0px 8px 24px rgba(38, 24, 69, 0.16)',
  },
  barItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  barItemLabel: {
    fontSize: 11,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -28,
    backgroundColor: Palette.purpleInk,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Palette.canvas,
    boxShadow: '0px 4px 16px rgba(38, 24, 69, 0.35)',
  },
  fabPressed: {
    opacity: 0.85,
  },
});
