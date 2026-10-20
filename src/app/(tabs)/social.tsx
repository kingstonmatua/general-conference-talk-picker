import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FriendsSection } from '@/components/social/friends-section';
import { LeaderboardSection } from '@/components/social/leaderboard-section';
import { ThemedText } from '@/components/themed-text';
import { UsernameForm } from '@/components/username-form';
import { Card } from '@/components/ui/card';
import { GuestSignUpCard } from '@/components/ui/guest-sign-up-card';
import { HeroBanner, HeroTextGlow } from '@/components/ui/hero-banner';
import { Pill } from '@/components/ui/pill';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSocial } from '@/hooks/use-social';

type SocialSection = 'leaderboard' | 'friends' | 'wall';

/**
 * Social tab (SOCIAL_PLAN.md). Guests get a full sign-up prompt; signed-in
 * users pick a username the first time (decision 6), then switch between
 * Leaderboard · Friends · Wall. The Wall stays "coming" until Update 2.
 */
export default function SocialScreen() {
  const { user } = useAuth();
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
            <GuestSignUpCard
              primary
              title="Join your friends"
              body="Create a free account to add friends, compare streaks and talks studied, and keep your progress on every device."
            />
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

              {section === 'leaderboard' && <LeaderboardSection onFindFriends={() => setSection('friends')} />}
              {section === 'friends' && <FriendsSection />}
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
  return (
    <Card style={styles.card}>
      <ThemedText type="section">Pick a username</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        Friends find you by your username, and it's what they see on the leaderboard. You can change it later on
        your Account screen.
      </ThemedText>
      <UsernameForm />
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
});
