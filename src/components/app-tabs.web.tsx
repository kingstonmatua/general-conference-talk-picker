import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { TabList, TabListProps, TabSlot, Tabs, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from './ui/button';
import { Icon, Ionicons, type AppIconName } from './ui/icon';
import { ThemedText } from './themed-text';

import { Palette, Spacing, WebSidebarWidth } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useDrawRandomTalk } from '@/hooks/use-draw-random-talk';

/**
 * Web nav shell — a persistent left sidebar (logo, a standing "Draw a
 * Random Talk" action, the four nav items), per brand board §07:
 * "Home · Browse · Progress · Saved. Active item uses purple ink, bold
 * label and gold chevron."
 *
 * Note: this sidebar is desktop-oriented and not yet responsive for a
 * phone browser hitting the web build (as opposed to the native app,
 * which has its own proper bottom tab bar in app-tabs.tsx). A narrow-web
 * bottom-bar variant was attempted here but expo-router/ui's <Tabs>
 * requires its <TabTrigger> children to stay static/always-mounted —
 * conditionally swapping between two <TabList> trees broke tab
 * registration at runtime ("Couldn't find any screens for the
 * navigator"). Left as a known follow-up rather than shipped broken.
 */
export default function AppTabs() {
  return (
    <Tabs style={styles.root}>
      <TabList asChild>
        <Sidebar>
          <TabTrigger name="home" href="/" asChild>
            <SidebarNavItem icon="home">Home</SidebarNavItem>
          </TabTrigger>
          <TabTrigger name="browse" href="/browse" asChild>
            <SidebarNavItem icon="browse">Browse</SidebarNavItem>
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
  const drawRandomTalk = useDrawRandomTalk();
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
        onPress={() => drawRandomTalk()}
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
  return (
    <Pressable {...pressableProps} style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.sidebarItem}>
        <Icon name={icon} size={20} color={isFocused ? Palette.purpleInk : Palette.secondaryInk} />
        <ThemedText
          type="control"
          style={[styles.sidebarItemLabel, { color: isFocused ? Palette.purpleInk : Palette.secondaryInk }]}>
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
  slot: {
    flex: 1,
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
