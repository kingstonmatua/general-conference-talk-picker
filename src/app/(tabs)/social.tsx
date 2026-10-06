import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroBanner, HeroTextGlow } from '@/components/ui/hero-banner';
import { Pill } from '@/components/ui/pill';
import { BottomTabInset, MaxContentWidth, Palette, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSocial } from '@/hooks/use-social';

// Same rule as set_username() in supabase/social.sql, checked here too so
// the Save button can explain the problem before a round trip.
const USERNAME_PATTERN = /^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$/;

type SocialSection = 'leaderboard' | 'friends' | 'wall';

/**
 * Social tab (SOCIAL_PLAN.md). Guests get a full sign-up prompt; signed-in
 * users pick a username the first time (decision 6), then switch between
 * Leaderboard · Friends · Wall. Friends (step 5) and Leaderboard (step 6)
 * are still placeholders; the Wall stays "coming" until Update 2.
 */
export default function SocialScreen() {
  const { user, promptSignIn } = useAuth();
  const { loading, profile, needsProfile, incomingRequests } = useSocial();
  const [section, setSection] = useState<SocialSection>('leaderboard');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <HeroBanner source={require('@/assets/images/hero/salt-lake-temple.png')}>
            <ThemedText type="display" style={styles.heroHeadline}>
              Study together.
            </ThemedText>
            <ThemedText type="body" style={styles.heroSubhead}>
              See how your friends are studying, and cheer each other on.
            </ThemedText>
          </HeroBanner>
        </View>

        <View style={styles.content}>
          {!user ? (
            <Card style={styles.card}>
              <ThemedText type="section">Join your friends</ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                Create a free account to add friends, compare streaks and talks studied, and keep your progress on
                every device.
              </ThemedText>
              <Button label="Sign up or sign in" variant="primary" onPress={promptSignIn} />
            </Card>
          ) : loading ? (
            <ThemedText type="body" themeColor="textSecondary">
              Loading…
            </ThemedText>
          ) : needsProfile || !profile ? (
            <UsernameSetup />
          ) : (
            <>
              <ThemedText type="metadata" themeColor="textSecondary">
                @{profile.username}
              </ThemedText>

              <View style={styles.pillRow}>
                <Pill label="Leaderboard" selected={section === 'leaderboard'} onPress={() => setSection('leaderboard')} />
                <Pill
                  label={incomingRequests.length > 0 ? `Friends (${incomingRequests.length})` : 'Friends'}
                  selected={section === 'friends'}
                  onPress={() => setSection('friends')}
                />
                <Pill label="Wall" selected={section === 'wall'} onPress={() => setSection('wall')} />
              </View>

              {section === 'leaderboard' && (
                <Section title="Leaderboard" body="Talks studied and streaks for you and your friends. Coming soon." />
              )}
              {section === 'friends' && (
                <Section
                  title="Friends"
                  body={
                    incomingRequests.length > 0
                      ? `${incomingRequests.length} friend ${incomingRequests.length === 1 ? 'request' : 'requests'} waiting. Coming soon.`
                      : 'Find friends by username or share an invite link. Coming soon.'
                  }
                />
              )}
              {section === 'wall' && (
                <Section title="Wall" body="Share thoughts on the talks you've studied. Coming in a later update." />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function UsernameSetup() {
  const { setUsername } = useSocial();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = value.trim().replace(/^@/, '');
  const valid = USERNAME_PATTERN.test(username) && !username.includes('..');
  const hint =
    username.length === 0
      ? '3–20 characters: lowercase letters, numbers, _ and .'
      : username.length < 3
        ? 'At least 3 characters.'
        : username.length > 20
          ? 'No more than 20 characters.'
          : !valid
            ? 'Only lowercase letters, numbers, _ and . (no ".." and no "." at the start or end).'
            : `You'll be @${username}`;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const result = await setUsername(username);
    // On success the provider reloads the profile and this screen swaps
    // to the sections, so there's nothing more to do here.
    if (result.error) {
      setError(result.error);
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <ThemedText type="section">Pick a username</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        Friends find you by your username, and it's what they see on the leaderboard. You can change it later.
      </ThemedText>

      <View style={styles.usernameField}>
        <ThemedText type="control" themeColor="textSecondary">
          @
        </ThemedText>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text.toLowerCase());
            setError(null);
          }}
          onSubmitEditing={save}
          placeholder="username"
          placeholderTextColor={Palette.secondaryInk}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          maxLength={21}
          returnKeyType="done"
          style={styles.usernameInput}
        />
      </View>

      <ThemedText type="metadata" style={error ? styles.error : { color: Palette.secondaryInk }}>
        {error ?? hint}
      </ThemedText>

      <Button label={saving ? 'Saving…' : 'Save username'} variant="primary" disabled={!valid || saving} onPress={save} />
    </Card>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <Card style={styles.card}>
      <ThemedText type="section">{title}</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {body}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.xxxl,
  },
  heroWrap: {
    width: '100%',
  },
  heroHeadline: {
    color: Palette.purpleInk,
    ...HeroTextGlow,
  },
  heroSubhead: {
    color: '#47444B',
    ...HeroTextGlow,
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
    alignItems: 'flex-start',
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  usernameField: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    borderRadius: Radii.button,
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  usernameInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.purpleInk,
  },
  error: {
    color: Palette.terracotta,
  },
});
