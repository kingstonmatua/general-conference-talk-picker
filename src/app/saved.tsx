import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { HeroBanner } from '@/components/ui/hero-banner';
import { Pill } from '@/components/ui/pill';
import { SearchField } from '@/components/ui/search-field';
import { TalkCard } from '@/components/ui/talk-card';
import { BottomTabInset, MaxContentWidth, Palette, Spacing, type SessionCategory } from '@/constants/theme';

// Placeholder content — no favorites/saved-state backend wired up yet.
// Search and the status filter genuinely work against this small sample
// list, and unsaving a card here removes it from the list (local state
// only, resets on reload).
type SavedTalk = {
  id: string;
  category: SessionCategory;
  title: string;
  meta: string;
  status: 'To study' | 'Studied';
};

const SAMPLE_SAVED: SavedTalk[] = [
  {
    id: '1',
    category: 'SUNDAY_AFTERNOON',
    title: 'Think Celestial!',
    meta: 'Russell M. Nelson · October 2023',
    status: 'To study',
  },
  {
    id: '2',
    category: 'SUNDAY_MORNING',
    title: 'The Power of Spiritual Momentum',
    meta: 'Russell M. Nelson · April 2022',
    status: 'Studied',
  },
  {
    id: '3',
    category: 'SATURDAY_AFTERNOON',
    title: 'Nourish the Roots, and the Branches Will Grow',
    meta: 'Dieter F. Uchtdorf · October 2024',
    status: 'To study',
  },
  {
    id: '4',
    category: 'WELFARE',
    title: 'The Blessings of Temple Worship',
    meta: 'Henry B. Eyring · April 2022',
    status: 'To study',
  },
];

const STATUS_FILTERS = ['Any status', 'Not studied', 'Studied'] as const;

export default function SavedScreen() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('Any status');
  const [saved, setSaved] = useState(SAMPLE_SAVED);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return saved.filter((talk) => {
      if (status === 'Not studied' && talk.status !== 'To study') return false;
      if (status === 'Studied' && talk.status !== 'Studied') return false;
      if (!q) return true;
      return talk.title.toLowerCase().includes(q) || talk.meta.toLowerCase().includes(q);
    });
  }, [saved, query, status]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <HeroBanner source={require('@/assets/images/hero/laie-hawaii-temple.png')}>
            <ThemedText type="display" style={styles.heroHeadline}>
              Words to return to.
            </ThemedText>
            <ThemedText type="body" style={styles.heroSubhead}>
              Your saved messages, ready when you need them.
            </ThemedText>
          </HeroBanner>
        </View>

        <View style={styles.content}>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search your saved talks" />

          <View style={styles.pillRow}>
            {STATUS_FILTERS.map((option) => (
              <Pill key={option} label={option} selected={status === option} onPress={() => setStatus(option)} />
            ))}
          </View>

          <ThemedText type="metadata" themeColor="textSecondary">
            {results.length} saved
          </ThemedText>

          <View style={styles.list}>
            {results.map((talk) => (
              <TalkCard
                key={talk.id}
                category={talk.category}
                title={talk.title}
                meta={talk.meta}
                statusLabel={talk.status}
                favorite
                onToggleFavorite={() => setSaved((prev) => prev.filter((t) => t.id !== talk.id))}
              />
            ))}
            {results.length === 0 && (
              <ThemedText type="body" themeColor="textSecondary">
                No saved talks match that search and filter combination.
              </ThemedText>
            )}
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
    color: Palette.purpleInk,
  },
  heroSubhead: {
    color: Palette.secondaryInk,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  list: {
    gap: Spacing.md,
  },
});
