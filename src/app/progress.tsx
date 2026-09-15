import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { HeroBanner } from '@/components/ui/hero-banner';
import { Pill } from '@/components/ui/pill';
import { StatTile } from '@/components/ui/stat-tile';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

// Placeholder content — no study-event log wired up yet, so the stats
// below are static sample values, not derived from real data. Progress
// Scope selection works (local state) but doesn't recompute anything yet,
// consistent with the locked rule that scope is reporting-only and never
// touches Draw/Browse — see project memory on "Progress Scope".
const SCOPE_OPTIONS = ['All Conferences', 'Last 5 Years', 'Last 10 Years', 'Custom Range'] as const;

const RECENTLY_STUDIED_CONFERENCES = [
  { label: 'April 2025', detail: '14 of 32 talks studied', percent: 44 },
  { label: 'October 2024', detail: '21 of 34 talks studied', percent: 62 },
  { label: 'April 2024', detail: '8 of 32 talks studied', percent: 25 },
];

const RECENTLY_STUDIED_SPEAKERS = [
  { label: 'Dallin H. Oaks', detail: '18 of 42 talks studied', percent: 43 },
  { label: 'Dieter F. Uchtdorf', detail: '12 of 38 talks studied', percent: 32 },
  { label: 'Henry B. Eyring', detail: '15 of 41 talks studied', percent: 37 },
];

export default function ProgressScreen() {
  const [scope, setScope] = useState<(typeof SCOPE_OPTIONS)[number]>('All Conferences');

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
          <View style={styles.scopeRow}>
            <ThemedText type="eyebrow" style={{ color: Palette.goldInk }}>
              Progress scope
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {SCOPE_OPTIONS.map((option) => (
                <Pill key={option} label={option} selected={scope === option} onPress={() => setScope(option)} />
              ))}
            </ScrollView>
            <ThemedText type="metadata" themeColor="textSecondary">
              Changes the statistics on this page only — Draw and Browse keep their own filters.
            </ThemedText>
          </View>

          <Card style={styles.overallCard}>
            <ThemedText type="eyebrow" style={{ color: Palette.goldInk }}>
              Overall study progress
            </ThemedText>
            <ThemedText type="section">28% · 68 of 242 talks</ThemedText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '28%' }]} />
            </View>
          </Card>

          <View style={styles.statsRow}>
            <StatTile icon="studied" color="sage" value="68" label="Talks studied" />
            <StatTile icon="streak" color="terracotta" value="7" label="Day streak" />
            <StatTile icon="streakFilled" color="champagne" value="24" label="Longest streak" />
          </View>

          <ThemedText type="section">Recently Studied Conferences</ThemedText>
          <View style={styles.list}>
            {RECENTLY_STUDIED_CONFERENCES.map((item) => (
              <ProgressRow key={item.label} {...item} />
            ))}
          </View>

          <ThemedText type="section">Recently Studied Speakers</ThemedText>
          <View style={styles.list}>
            {RECENTLY_STUDIED_SPEAKERS.map((item) => (
              <ProgressRow key={item.label} {...item} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressRow({ label, detail, percent }: { label: string; detail: string; percent: number }) {
  return (
    <Card style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <ThemedText type="control">{label}</ThemedText>
        <ThemedText type="metadata" themeColor="textSecondary">
          {percent}%
        </ThemedText>
      </View>
      <ThemedText type="metadata" themeColor="textSecondary">
        {detail}
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
  scopeRow: {
    gap: Spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
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
