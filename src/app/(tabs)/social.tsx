import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroBanner, HeroTextGlow } from '@/components/ui/hero-banner';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSocial } from '@/hooks/use-social';

/**
 * Social tab (SOCIAL_PLAN.md). Build step 3 only adds the tab itself: a
 * full sign-up prompt for guests, and placeholders for the three sections.
 * Username setup (step 4), Friends (step 5) and Leaderboard (step 6) fill
 * these in; the Wall stays "coming soon" until Update 2.
 */
export default function SocialScreen() {
  const { user, promptSignIn } = useAuth();
  const { profile, incomingRequests } = useSocial();

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
          ) : (
            <>
              {profile && (
                <ThemedText type="metadata" themeColor="textSecondary">
                  Signed in as @{profile.username}
                </ThemedText>
              )}
              <Section title="Leaderboard" body="Talks studied and streaks for you and your friends. Coming soon." />
              <Section
                title="Friends"
                body={
                  incomingRequests.length > 0
                    ? `${incomingRequests.length} friend ${incomingRequests.length === 1 ? 'request' : 'requests'} waiting. Coming soon.`
                    : 'Find friends by username or share an invite link. Coming soon.'
                }
              />
              <Section title="Wall" body="Share thoughts on the talks you've studied. Coming in a later update." />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
});
