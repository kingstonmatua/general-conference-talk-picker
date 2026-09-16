import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConferenceFilterBar, ConferenceFilterModal, useConferenceFilters } from '@/components/ui/conference-filters';
import { HeroBanner, HeroTextGlow } from '@/components/ui/hero-banner';
import { StatTile } from '@/components/ui/stat-tile';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { TALKS } from '@/data/talks';
import { useAuth } from '@/hooks/use-auth';
import { useTalkStatus } from '@/hooks/use-talk-status';

const MONTH_NAMES: Record<number, string> = { 4: 'April', 10: 'October' };
const RECENT_GROUP_LIMIT = 3;

type GroupAgg = { label: string; studied: number; total: number; latestStudiedAt: string };

export default function ProgressScreen() {
  const { user, promptSignIn } = useAuth();
  const { studiedCount, currentStreak, longestStreak, getStatus, studiedIdsByRecency } = useTalkStatus();
  // Replaces the old preset-based Scope (All Conferences/Last 5 Years/
  // Last 10 Years/Custom Range-disabled) with the same Year → Conference
  // → Session dropdowns Browse and Saved use — this instance is its own
  // independent state, so it stays true to the locked "Progress Scope
  // only changes this page" rule without any extra wiring.
  const conferenceFilters = useConferenceFilters(TALKS);
  const scopedTalks = conferenceFilters.filteredTalks;

  const overallStudiedInScope = useMemo(
    () => scopedTalks.reduce((n, t) => n + (getStatus(t.id).isStudied ? 1 : 0), 0),
    [scopedTalks, getStatus],
  );
  const overallPercent = scopedTalks.length > 0 ? Math.round((overallStudiedInScope / scopedTalks.length) * 100) : 0;

  const { conferences, speakers } = useMemo(() => {
    const byConference = new Map<string, GroupAgg>();
    const bySpeaker = new Map<string, GroupAgg>();

    for (const talk of scopedTalks) {
      const status = getStatus(talk.id);
      const confKey = `${talk.year}-${talk.month}`;
      const confLabel = `${MONTH_NAMES[talk.month] ?? `Month ${talk.month}`} ${talk.year}`;

      const confAgg = byConference.get(confKey) ?? { label: confLabel, studied: 0, total: 0, latestStudiedAt: '' };
      confAgg.total += 1;
      if (status.isStudied) {
        confAgg.studied += 1;
        if ((status.studiedAt ?? '') > confAgg.latestStudiedAt) confAgg.latestStudiedAt = status.studiedAt ?? '';
      }
      byConference.set(confKey, confAgg);

      const speakerAgg = bySpeaker.get(talk.speaker) ?? {
        label: talk.speaker,
        studied: 0,
        total: 0,
        latestStudiedAt: '',
      };
      speakerAgg.total += 1;
      if (status.isStudied) {
        speakerAgg.studied += 1;
        if ((status.studiedAt ?? '') > speakerAgg.latestStudiedAt) speakerAgg.latestStudiedAt = status.studiedAt ?? '';
      }
      bySpeaker.set(talk.speaker, speakerAgg);
    }

    const topRecent = (map: Map<string, GroupAgg>) =>
      [...map.values()]
        .filter((g) => g.studied > 0)
        .sort((a, b) => b.latestStudiedAt.localeCompare(a.latestStudiedAt))
        .slice(0, RECENT_GROUP_LIMIT);

    return { conferences: topRecent(byConference), speakers: topRecent(bySpeaker) };
    // studiedIdsByRecency isn't read directly, but including it keeps this
    // memo in sync every time studied status changes.
  }, [scopedTalks, getStatus, studiedIdsByRecency]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <HeroBanner source={require('@/assets/images/hero/salt-lake-temple.png')}>
            <ThemedText type="display" style={styles.heroHeadline}>
              Steady Progress Brings Light.
            </ThemedText>
            <ThemedText type="body" style={styles.heroSubhead}>
              Small moments of study add up to meaningful progress.
            </ThemedText>
          </HeroBanner>
        </View>

        <View style={styles.content}>
          {!user ? (
            <Card style={styles.signInCard}>
              <ThemedText type="body" themeColor="textSecondary">
                Sign in to see your study progress.
              </ThemedText>
              <Button label="Sign in" variant="primary" onPress={promptSignIn} />
            </Card>
          ) : (
            <>
              <View style={styles.scopeRow}>
                <ThemedText type="eyebrow" style={{ color: Palette.goldInk }}>
                  Progress scope
                </ThemedText>
                <ConferenceFilterBar state={conferenceFilters} />
                <ThemedText type="metadata" themeColor="textSecondary">
                  Changes the statistics on this page only — Draw and Browse keep their own filters.
                </ThemedText>
              </View>

              <Card style={styles.overallCard}>
                <ThemedText type="eyebrow" style={{ color: Palette.goldInk }}>
                  Overall study progress
                </ThemedText>
                <ThemedText type="section">
                  {overallPercent}% · {overallStudiedInScope} of {scopedTalks.length} talks
                </ThemedText>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${overallPercent}%` }]} />
                </View>
              </Card>

              <View style={styles.statsRow}>
                <StatTile icon="studied" color="sage" value={String(studiedCount)} label="Talks studied" />
                <StatTile icon="streak" color="terracotta" value={String(currentStreak)} label="Day streak" />
                <StatTile
                  icon="streakFilled"
                  color="champagne"
                  value={String(longestStreak)}
                  label="Longest streak"
                />
              </View>

              <ThemedText type="section">Recently Studied Conferences</ThemedText>
              <View style={styles.list}>
                {conferences.map((item) => (
                  <ProgressRow key={item.label} {...item} />
                ))}
                {conferences.length === 0 && (
                  <ThemedText type="body" themeColor="textSecondary">
                    Mark a talk as studied to see conference progress here.
                  </ThemedText>
                )}
              </View>

              <ThemedText type="section">Recently Studied Speakers</ThemedText>
              <View style={styles.list}>
                {speakers.map((item) => (
                  <ProgressRow key={item.label} {...item} />
                ))}
                {speakers.length === 0 && (
                  <ThemedText type="body" themeColor="textSecondary">
                    Mark a talk as studied to see speaker progress here.
                  </ThemedText>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <ConferenceFilterModal state={conferenceFilters} />
    </SafeAreaView>
  );
}

function ProgressRow({ label, studied, total }: GroupAgg) {
  const percent = total > 0 ? Math.round((studied / total) * 100) : 0;
  return (
    <Card style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <ThemedText type="control">{label}</ThemedText>
        <ThemedText type="metadata" themeColor="textSecondary">
          {percent}%
        </ThemedText>
      </View>
      <ThemedText type="metadata" themeColor="textSecondary">
        {studied} of {total} talks studied
      </ThemedText>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
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
    color: Palette.purpleInk,
    ...HeroTextGlow,
  },
  heroSubhead: {
    // Darker than the app's usual secondaryInk gray — scoped to just
    // the hero subhead, not the shared token used elsewhere.
    color: '#47444B',
    ...HeroTextGlow,
  },
  signInCard: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  scopeRow: {
    gap: Spacing.sm,
  },
  overallCard: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.warmBorder,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.champagne,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  rowCard: {
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});
