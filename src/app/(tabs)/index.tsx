import { Link, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroBanner } from '@/components/ui/hero-banner';
import { StatTile } from '@/components/ui/stat-tile';
import { TalkCard } from '@/components/ui/talk-card';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { formatTalkMeta, getTalkById } from '@/data/talks';
import { useAuth } from '@/hooks/use-auth';
import { useDrawRandomTalk } from '@/hooks/use-draw-random-talk';
import { useTalkStatus } from '@/hooks/use-talk-status';

export default function HomeScreen() {
  const { user, promptSignIn } = useAuth();
  const { studiedCount, favoriteIds, currentStreak, getStatus, markStudied } = useTalkStatus();
  const router = useRouter();
  const drawRandomTalk = useDrawRandomTalk();

  // "Continue Studying" = talks you've saved but haven't studied yet.
  // There's no partial in-progress-within-a-talk concept in this app (no
  // duration/reading-time field — see project decisions), so this is a
  // to-do list, not a progress bar.
  const continueStudying = useMemo(
    () =>
      favoriteIds
        .map((id) => getTalkById(id))
        .filter((t): t is NonNullable<typeof t> => t !== undefined && !getStatus(t.id).isStudied)
        .slice(0, 2),
    [favoriteIds, getStatus],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <HeroBanner source={require('@/assets/images/hero/san-diego-temple.png')}>
            <ThemedText type="display" style={styles.heroHeadline}>
              A little study. A lasting difference.
            </ThemedText>
            <ThemedText type="body" style={styles.heroSubhead}>
              Make room for an inspired message today.
            </ThemedText>
          </HeroBanner>
        </View>

        <View style={styles.content}>
          <Card style={styles.dailyMomentCard}>
            <ThemedText type="eyebrow" style={{ color: Palette.goldInk }}>
              Your daily moment
            </ThemedText>
            <ThemedText type="section">What will you discover today?</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              Draw a General Conference talk and find something to carry with you.
            </ThemedText>
            <Button label="Draw a Random Talk" variant="primary" onPress={drawRandomTalk} />
          </Card>

          {!user ? (
            <Card style={styles.signInCard}>
              <ThemedText type="body" themeColor="textSecondary">
                Sign in to track studied talks, saves, and your study streak.
              </ThemedText>
              <Button label="Sign in" variant="primary" onPress={promptSignIn} />
            </Card>
          ) : (
            <>
              <View style={styles.statsRow}>
                <StatTile icon="studied" color="sage" value={String(studiedCount)} label="Talks studied" />
                <StatTile icon="streak" color="terracotta" value={String(currentStreak)} label="Day streak" />
                <StatTile icon="saved" color="lavender" value={String(favoriteIds.length)} label="Saved talks" />
              </View>

              <View style={styles.sectionHeader}>
                <ThemedText type="section">Continue Studying</ThemedText>
                <Link href="/browse" asChild>
                  <ThemedText type="control" style={{ color: Palette.conferencePurple }}>
                    Browse all talks →
                  </ThemedText>
                </Link>
              </View>

              <View style={styles.talkCardStack}>
                {continueStudying.map((talk) => (
                  <TalkCard
                    key={talk.id}
                    category={talk.category}
                    title={talk.title}
                    meta={formatTalkMeta(talk)}
                    statusLabel="Saved"
                    actionLabel="Mark as studied →"
                    onPressAction={() => markStudied(talk.id)}
                    onPress={() => router.push({ pathname: '/talk/[id]', params: { id: talk.id } })}
                  />
                ))}
                {continueStudying.length === 0 && (
                  <ThemedText type="body" themeColor="textSecondary">
                    Nothing waiting right now — save a talk from Browse to pick it up here.
                  </ThemedText>
                )}
              </View>
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
    paddingBottom: BottomTabInset + Spacing.xxxl,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    // Pulls the daily-moment card up so the image bleeds behind roughly
    // the top half of the card, not just its edge.
    marginTop: -104,
    gap: Spacing.lg,
  },
  heroWrap: {
    width: '100%',
  },
  heroHeadline: {
    color: Palette.purpleInk,
  },
  heroSubhead: {
    color: Palette.secondaryInk,
  },
  dailyMomentCard: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: Palette.softLavender,
    borderColor: Palette.softLavender,
    // Brand board §03: "Default shadow: none; overlays only, 0 4 16 at
    // 6% ink" — this card now overlaps the hero image, so it qualifies.
    shadowColor: Palette.purpleInk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  signInCard: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  talkCardStack: {
    gap: Spacing.md,
  },
});
