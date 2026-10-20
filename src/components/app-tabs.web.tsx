import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { TabList, TabListProps, TabSlot, Tabs, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Children } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from './ui/button';
import { Icon, Ionicons, type AppIconName } from './ui/icon';
import { ThemedText } from './themed-text';

import { Palette, Spacing, WebSidebarWidth } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIsPhoneWeb } from '@/hooks/use-web-layout';

/**
 * Web nav shell — a persistent left sidebar (logo, a standing "Draw a
 * Random Talk" action, the nav items), per brand board §07: "Active item
 * uses purple ink, bold label and gold chevron." The items are Home ·
 * Browse · Social · Progress · Saved (SOCIAL_PLAN.md decision 7 added
 * Social; Saved stays listed here even though it folds into Browse on
 * native, since the sidebar has the room)."
 *
 * In a phone-sized window the same shell restyles itself into a bottom
 * tab bar with a center Draw button, like the native app's (app-tabs.tsx);
 * the logo and account entry move to BrandedHeaderRow over each hero.
 * It's one <TabList> tree restyled in place, not two trees swapped:
 * expo-router/ui's <Tabs> needs its <TabTrigger>s to stay mounted, and
 * swapping trees broke tab registration ("Couldn't find any screens for
 * the navigator").
 */
export default function AppTabs() {
  const isPhoneWeb = useIsPhoneWeb();
  return (
    <Tabs style={[styles.root, isPhoneWeb && styles.rootPhone]}>
      <TabList asChild>
        <Sidebar>
          <TabTrigger name="home" href="/" asChild>
            <SidebarNavItem icon="home">Home</SidebarNavItem>
          </TabTrigger>
          <TabTrigger name="browse" href="/browse" asChild>
            <SidebarNavItem icon="browse">Browse</SidebarNavItem>
          </TabTrigger>
          <TabTrigger name="social" href="/social" asChild>
            <SidebarNavItem icon="social">Social</SidebarNavItem>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <SidebarNavItem icon="progress">Progress</SidebarNavItem>
          </TabTrigger>
          <TabTrigger name="saved" href="/saved" asChild>
            <SidebarNavItem icon="saved">Saved</SidebarNavItem>
          </TabTrigger>
        </Sidebar>
      </TabList>

      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

function Sidebar(props: TabListProps) {
  const router = useRouter();
  const isPhoneWeb = useIsPhoneWeb();

  if (isPhoneWeb) {
    // Same children in the same slots as the desktop branch below — the
    // Draw button just fills the gap between Browse and Progress.
    const items = Children.toArray(props.children);
    return (
      <View style={styles.bar}>
        {items.slice(0, 2)}
        <Pressable
          onPress={() => router.push('/draw')}
          hitSlop={8}
          accessibilityLabel="Draw a Random Talk"
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
          <Icon name="draw" size={26} color="#FFFFFF" />
        </Pressable>
        {items.slice(2)}
      </View>
    );
  }

  return (
    <View style={styles.sidebar}>
      <Image
        source={require('@/assets/images/brand/main-logo.png')}
        style={styles.logo}
        contentFit="contain"
      />

      <Button
        label="Draw a Random Talk"
        variant="primary"
        style={styles.drawButton}
        onPress={() => router.push('/draw')}
      />

      <View style={styles.navList}>{props.children}</View>

      <View style={styles.sidebarFooter}>
        <AccountRow />
      </View>
    </View>
  );
}

function SidebarNavItem({
  children,
  isFocused,
  icon,
  ...pressableProps
}: TabTriggerSlotProps & { icon: AppIconName }) {
  const isPhoneWeb = useIsPhoneWeb();
  const color = isFocused ? Palette.purpleInk : Palette.secondaryInk;

  if (isPhoneWeb) {
    return (
      <Pressable {...pressableProps} style={({ pressed }) => [styles.barItem, pressed && styles.pressed]}>
        <Icon name={icon} size={22} color={color} />
        <ThemedText type="metadata" style={[styles.barItemLabel, { color }]}>
          {children}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable {...pressableProps} style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.sidebarItem}>
        <Icon name={icon} size={20} color={color} />
        <ThemedText type="control" style={[styles.sidebarItemLabel, { color }]}>
          {children}
        </ThemedText>
        {isFocused && <Ionicons name="chevron-down" size={14} color={Palette.goldInk} />}
      </View>
    </Pressable>
  );
}

function AccountRow() {
  const { user, avatarUrl, promptSignIn, signOut } = useAuth();

  if (!user) {
    return (
      <Pressable onPress={promptSignIn} hitSlop={8}>
        <ThemedText type="control" style={{ color: Palette.conferencePurple }}>
          Sign in to track progress
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={{ gap: Spacing.sm }}>
      <Link href="/account" asChild>
        <Pressable style={styles.accountLink} hitSlop={8}>
          <View style={styles.accountAvatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.accountAvatarImage} contentFit="cover" />
            ) : (
              <Icon name="account" size={22} color={Palette.purpleInk} />
            )}
          </View>
          <ThemedText type="metadata" themeColor="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
            {user.email}
          </ThemedText>
        </Pressable>
      </Link>
      <Pressable onPress={() => signOut()} hitSlop={8}>
        <ThemedText type="control" style={{ color: Palette.conferencePurple }}>
          Sign out
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Palette.canvas,
  },
  // The bar is TabList's first child, so reversing the column puts it at
  // the bottom — in the flow, so it never covers the end of a page.
  rootPhone: {
    flexDirection: 'column-reverse',
  },
  slot: {
    flex: 1,
  },
  bar: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.warmBorder,
    boxShadow: '0px -4px 16px rgba(38, 24, 69, 0.08)',
    zIndex: 1,
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
  sidebar: {
    width: WebSidebarWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderRightWidth: 1,
    borderRightColor: Palette.warmBorder,
    backgroundColor: Palette.surface,
    gap: Spacing.lg,
  },
  logo: {
    width: '100%',
    height: 56,
  },
  drawButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  navList: {
    gap: Spacing.xs,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  sidebarItemLabel: {
    flex: 1,
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.warmBorder,
  },
  pressed: {
    opacity: 0.7,
  },
  accountLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accountAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accountAvatarImage: {
    width: 28,
    height: 28,
  },
});
