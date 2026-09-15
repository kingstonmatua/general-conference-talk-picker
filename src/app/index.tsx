import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroBanner } from '@/components/ui/hero-banner';
import { PageFoldIcon } from '@/components/ui/page-fold-icon';
import { StatTile } from '@/components/ui/stat-tile';
import { TalkCard } from '@/components/ui/talk-card';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

// Placeholder content — there is no data layer wired up yet (no talks
// dataset, no Supabase, no streak/event log). This is the real screen
// layout with representative sample values, not live state. Buttons and
// links here are not yet wired to any behavior.
const CONTINUE_STUDYING = [
  {
    category: 'SUNDAY_AFTERNOON' as const,
    title: 'Think Celestial!',
    meta: 'Russell M. Nelson · October 2023',
    progressPercent: 72,
    statusLabel: 'In progress',
    actionLabel: 'Continue study →',
  },
  {
    category: 'SATURDAY_AFTERNOON' as const,
    title: 'Nourish the Roots, and the Branches Will Grow',
    meta: 'Dieter F. Uchtdorf · October 2024',
    progressPercent: 36,
    statusLabel: 'In progress',
    actionLabel: 'Continue study →',
  },
];

export default function HomeScreen() {
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
            <PageFoldIcon size={28} />
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
            <Button label="Draw a Random Talk" variant="primary" />
          </Card>

          <View style={styles.statsRow}>
            <StatTile icon="studied" color="sage" value="12" label="Talks studied" />
            <StatTile icon="streak" color="terracotta" value="7" label="Day streak" />
            <StatTile icon="saved" color="lavender" value="8" label="Saved talks" />
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText type="section">Continue Studying</ThemedText>
            <ThemedText type="control" style={{ color: Palette.conferencePurple }}>
              Browse all talks →
            </ThemedText>
          </View>

          <View style={styles.talkCardStack}>
            {CONTINUE_STUDYING.map((talk) => (
              <TalkCard key={talk.title} {...talk} />
            ))}
          </View>
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
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  heroWrap: {
    width: '100%',
  },
  heroHeadline: {
    color: '#FFFFFF',
  },
  heroSubhead: {
    color: 'rgba(255,255,255,0.85)',
  },
  dailyMomentCard: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: Palette.softLavender,
    borderColor: Palette.softLavender,
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
