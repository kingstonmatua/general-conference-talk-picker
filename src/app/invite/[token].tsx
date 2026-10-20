import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/social/person-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UsernameForm } from '@/components/username-form';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSocial, type Person } from '@/hooks/use-social';

const APP_STORE_URL = 'https://apps.apple.com/app/general-conference-talk-picker/id6812966862';

/**
 * Where a shared invite link lands: https://gctalkpicker.app/invite/<token>
 * (SOCIAL_PLAN.md). Shows whose invite it is (works for guests), then walks
 * the visitor through sign-in and username setup if needed, and accepting
 * makes them friends right away. Root Stack sibling like talk/[id].
 */
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { user, promptSignIn, promptSignUp } = useAuth();
  const { loading, profile, getInviteOwner, redeemInvite } = useSocial();
  const [owner, setOwner] = useState<Person | null | undefined>(undefined);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Person | null>(null);

  useEffect(() => {
    if (!token) return setOwner(null);
    getInviteOwner(token).then((result) => setOwner(result.data ?? null));
  }, [token, getInviteOwner]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    const result = await redeemInvite(token);
    setAccepting(false);
    if (result.error) setError(result.error);
    else setAccepted(result.data ?? owner ?? null);
  };

  const goToSocial = () => router.replace('/social');

  let body;
  if (owner === undefined) {
    body = (
      <ThemedText type="body" themeColor="textSecondary">
        Loading invite…
      </ThemedText>
    );
  } else if (owner === null) {
    body = (
      <Card style={styles.card}>
        <ThemedText type="section">This invite link doesn’t work</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          It may be old or mistyped. Ask your friend to send their link again.
        </ThemedText>
        <Button label="Open the app" variant="secondary" onPress={() => router.replace('/')} />
      </Card>
    );
  } else if (accepted) {
    body = (
      <Card style={styles.card}>
        <ThemedText type="section">You and @{accepted.username} are now friends</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          See how you compare on the leaderboard.
        </ThemedText>
        <Button label="Go to Social" variant="primary" onPress={goToSocial} />
      </Card>
    );
  } else {
    body = (
      <Card style={styles.card}>
        <View style={styles.ownerRow}>
          <Avatar url={owner.avatarUrl} size={56} />
          <View style={styles.flex}>
            <ThemedText type="section">@{owner.username}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              invited you to be friends on General Conference Talk Picker.
            </ThemedText>
          </View>
        </View>

        {!user ? (
          <>
            <ThemedText type="body" themeColor="textSecondary">
              Sign in or create a free account to accept.
            </ThemedText>
            <Button label="Create a free account" variant="primary" onPress={promptSignUp} />
            <Pressable onPress={promptSignIn} hitSlop={8} accessibilityRole="button">
              <ThemedText type="metadata" style={styles.link}>
                Already have an account? Sign in
              </ThemedText>
            </Pressable>
          </>
        ) : loading ? null : !profile ? (
          <>
            <ThemedText type="body" themeColor="textSecondary">
              First, pick a username. It’s how friends find you.
            </ThemedText>
            <UsernameForm />
          </>
        ) : (
          <Button label={accepting ? 'Accepting…' : 'Accept invite'} variant="primary" disabled={accepting} onPress={accept} />
        )}

        {error && (
          <ThemedText type="metadata" style={styles.error}>
            {error}
          </ThemedText>
        )}

        {Platform.OS === 'web' && (
          // A fresh install loses the invite (SOCIAL_PLAN.md), so say so up front.
          <ThemedText type="metadata" themeColor="textSecondary">
            On iPhone?{' '}
            <ThemedText type="metadata" style={styles.link} onPress={() => Linking.openURL(APP_STORE_URL)}>
              Get the app
            </ThemedText>
            , then tap this link again to accept there.
          </ThemedText>
        )}
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <ThemedText type="display">Friend invite</ThemedText>
          {body}
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
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  error: {
    color: Palette.terracotta,
  },
  link: {
    color: Palette.conferencePurple,
  },
});
