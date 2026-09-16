import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroBanner } from '@/components/ui/hero-banner';
import { Pill } from '@/components/ui/pill';
import { StatTile } from '@/components/ui/stat-tile';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { TALKS } from '@/data/talks';
import { useAuth } from '@/hooks/use-auth';
import { useTalkStatus } from '@/hooks/use-talk-status';

// "Custom Range" has no date-picker UI yet, so it's shown but disabled
// rather than faked — see project decisions on Progress Scope.
const SCOPE_OPTIONS = ['All Conferences', 'Last 5 Years', 'Last 10 Years', 'Custom Range'] as const;
const MONTH_NAMES: Record<number, string> = { 4: 'April', 10: 'October' };
const RECENT_GROUP_LIMIT = 3;

type GroupAgg = { label: string; studied: number; total: number; latestStudiedAt: string };

export default function ProgressScreen() {
  const { user, promptSignIn } = useAuth();
  const { studiedCount, currentStreak, longestStreak, getStatus, studiedIdsByRecency } = useTalkStatus();
  const [scope, setScope] = useState<(typeof SCOPE_OPTIONS)[number]>('All Conferences');

  const currentYear = new Date().getFullYear();
  const scopedTalks = useMemo(() => {
    if (scope === 'Last 5 Years') return TALKS.filter((t) => t.year >= currentYear - 5);
    if (scope === 'Last 10 Years') return TALKS.filter((t) => t.year >= currentYear - 10);
    return TALKS;
  }, [scope, currentYear]);

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                  {SCOPE_OPTIONS.map((option) => {
                    const disabled = option === 'Custom Range';
                    return (
                      <View key={option} style={disabled && styles.disabledPill}>
                        <Pill
                          label={disabled ? `${option} (soon)` : option}
                          selected={scope === option}
                          onPress={() => !disabled && setScope(option)}
                        />
                      </View>
                    );
                  })}
                </ScrollView>
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
  },
  heroSubhead: {
    color: Palette.secondaryInk,
  },
  signInCard: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  scopeRow: {
    gap: Spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  disabledPill: {
    opacity: 0.45,
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
