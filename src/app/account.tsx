import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, Ionicons } from '@/components/ui/icon';
import { StatTile } from '@/components/ui/stat-tile';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTalkStatus } from '@/hooks/use-talk-status';

/**
 * Reached from the hero's account button on native (branded-header.tsx)
 * and the sidebar footer on web (app-tabs.web.tsx) — replaces the
 * earlier native-only bare Alert.alert sign-out popup with a real
 * screen shared by both platforms. Sibling of `talk/[id]` in the root
 * Stack, not inside `(tabs)`, same reasoning as that screen:
 * expo-router/ui's Tabs only renders routes registered as a
 * <TabTrigger>.
 *
 * Profile picture upload needs a Supabase Storage bucket named "avatars"
 * that doesn't exist by default — see the note left in SESSION_HANDOFF.md
 * for the one-time manual dashboard setup this depends on. Without that
 * bucket, uploads fail with a clear error rather than silently doing
 * nothing.
 */
export default function AccountScreen() {
  const router = useRouter();
  const { user, avatarUrl, updateAvatar, signOut, promptSignIn } = useAuth();
  const { studiedCount, currentStreak, longestStreak, favoriteIds } = useTalkStatus();
  const [uploading, setUploading] = useState(false);

  const pickAndUploadAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    const { error } = await updateAvatar(result.assets[0].uri);
    setUploading(false);
    if (error) Alert.alert('Couldn’t update profile picture', error);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
            <Ionicons name="chevron-back" size={18} color={Palette.secondaryInk} />
            <ThemedText type="control" themeColor="textSecondary">
              Back
            </ThemedText>
          </Pressable>

          <ThemedText type="display">Account</ThemedText>

          {!user ? (
            <Card style={styles.actionsCard}>
              <ThemedText type="body" themeColor="textSecondary">
                Sign in to manage your account.
              </ThemedText>
              <Button label="Sign in" variant="primary" onPress={promptSignIn} style={styles.fullWidthButton} />
            </Card>
          ) : (
            <>
              <Pressable onPress={pickAndUploadAvatar} disabled={uploading} style={styles.avatarRow}>
                <View style={styles.avatarCircle}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Icon name="account" size={56} color={Palette.purpleInk} />
                  )}
                  {uploading && (
                    <View style={styles.avatarLoadingOverlay}>
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <ThemedText type="control" style={styles.avatarActionLabel}>
                  {avatarUrl ? 'Change profile picture' : 'Add profile picture'}
                </ThemedText>
              </Pressable>

              <ThemedText type="body" themeColor="textSecondary">
                {user.email}
              </ThemedText>

              <View style={styles.statsRow}>
                <StatTile icon="studied" color="sage" value={String(studiedCount)} label="Talks studied" />
                <StatTile icon="streak" color="terracotta" value={String(currentStreak)} label="Day streak" />
                <StatTile
                  icon="streakFilled"
                  color="champagne"
                  value={String(longestStreak)}
                  label="Longest streak"
                />
                <StatTile icon="saved" color="lavender" value={String(favoriteIds.length)} label="Saved talks" />
              </View>

              <Card style={styles.actionsCard}>
                <Button
                  label="Sign out"
                  variant="secondary"
                  onPress={() => {
                    signOut();
                    router.back();
                  }}
                  style={styles.fullWidthButton}
                />
              </Card>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.xxxl,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  avatarRow: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 96,
    height: 96,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(38, 24, 69, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActionLabel: {
    color: Palette.conferencePurple,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionsCard: {
    gap: Spacing.sm,
    alignItems: 'stretch',
    marginTop: Spacing.lg,
  },
  fullWidthButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
