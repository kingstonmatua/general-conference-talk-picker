import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { HeroBanner } from '@/components/ui/hero-banner';
import { Pill } from '@/components/ui/pill';
import { SearchField } from '@/components/ui/search-field';
import { TalkCard } from '@/components/ui/talk-card';
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  SessionCategoryTag,
  SessionTagColors,
  Spacing,
  type SessionCategory,
} from '@/constants/theme';

// Placeholder content — no talks dataset or backend wired up yet. Search
// and the session-category filter genuinely work against this small
// sample list (real, client-side filtering), but there's nothing behind
// it beyond these six entries.
const SAMPLE_TALKS: {
  id: string;
  category: SessionCategory;
  title: string;
  meta: string;
  statusLabel: string;
  favorite: boolean;
}[] = [
  {
    id: '1',
    category: 'SATURDAY_MORNING',
    title: 'Divine Helps for Mortality',
    meta: 'Dallin H. Oaks · April 2025',
    statusLabel: 'Not studied',
    favorite: false,
  },
  {
    id: '2',
    category: 'SUNDAY_MORNING',
    title: 'By This All Will Know That You Are My Disciples',
    meta: 'Dieter F. Uchtdorf · April 2025',
    statusLabel: 'Studied',
    favorite: true,
  },
  {
    id: '3',
    category: 'SUNDAY_AFTERNOON',
    title: 'Confidence in the Presence of God',
    meta: 'Russell M. Nelson · April 2025',
    statusLabel: 'Not studied',
    favorite: false,
  },
  {
    id: '4',
    category: 'PRIESTHOOD',
    title: 'The Power of a Righteous Man',
    meta: 'David A. Bednar · October 2024',
    statusLabel: 'Not studied',
    favorite: false,
  },
  {
    id: '5',
    category: 'RELIEF_SOCIETY',
    title: 'A Pattern of Discipleship',
    meta: 'Cristina B. Franco · October 2024',
    statusLabel: 'Not studied',
    favorite: true,
  },
  {
    id: '6',
    category: 'WELFARE',
    title: 'Bear One Another’s Burdens',
    meta: 'Marion G. Romney · April 1974',
    statusLabel: 'Not studied',
    favorite: false,
  },
];

const CATEGORY_FILTERS = Object.keys(SessionCategoryTag) as SessionCategory[];

export default function BrowseScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SessionCategory | 'ALL'>('ALL');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_TALKS.filter((talk) => {
      if (category !== 'ALL' && talk.category !== category) return false;
      if (!q) return true;
      return talk.title.toLowerCase().includes(q) || talk.meta.toLowerCase().includes(q);
    });
  }, [query, category]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <HeroBanner source={require('@/assets/images/hero/washington-dc-temple.png')}>
            <ThemedText type="display" style={styles.heroHeadline}>
              Browse talks
            </ThemedText>
            <ThemedText type="body" style={styles.heroSubhead}>
              Explore messages by conference, session, or speaker.
            </ThemedText>
          </HeroBanner>
        </View>

        <View style={styles.content}>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search talk titles or speakers" />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            <Pill label="All" selected={category === 'ALL'} onPress={() => setCategory('ALL')} />
            {CATEGORY_FILTERS.map((cat) => {
              const { label, color } = SessionCategoryTag[cat];
              return (
                <Pill
                  key={cat}
                  label={label}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  color={SessionTagColors[color]}
                />
              );
            })}
          </ScrollView>

          <ThemedText type="metadata" themeColor="textSecondary">
            {results.length} {results.length === 1 ? 'talk' : 'talks'}
          </ThemedText>

          <View style={styles.list}>
            {results.map((talk) => (
              <TalkCard
                key={talk.id}
                category={talk.category}
                title={talk.title}
                meta={talk.meta}
                statusLabel={talk.statusLabel}
                favorite={favorites[talk.id] ?? talk.favorite}
                onToggleFavorite={() =>
                  setFavorites((prev) => ({ ...prev, [talk.id]: !(prev[talk.id] ?? talk.favorite) }))
                }
              />
            ))}
            {results.length === 0 && (
              <ThemedText type="body" themeColor="textSecondary">
                No talks match that search and filter combination.
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
    paddingRight: Spacing.xl,
  },
  list: {
    gap: Spacing.md,
  },
});
