import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, type LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
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
import { formatTalkMeta, TALKS } from '@/data/talks';
import { useTalkStatus } from '@/hooks/use-talk-status';

// Only offer categories that actually have talks in the real dataset —
// YOUNG_WOMEN is defined in the taxonomy for future-proofing but has zero
// matches today (see session-taxonomy.ts).
const CATEGORY_FILTERS = (Object.keys(SessionCategoryTag) as SessionCategory[]).filter((cat) =>
  TALKS.some((t) => t.category === cat),
);

export default function BrowseScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SessionCategory | 'ALL'>('ALL');
  const { getStatus, setFavorite } = useTalkStatus();
  const router = useRouter();
  // FlatList's per-item cell wrapper on react-native-web doesn't resolve
  // width:'100%' the way ScrollView content does, so cards shrink-wrap
  // instead of filling the column — measure the real slot width instead
  // of relying on a percentage.
  const [slotWidth, setSlotWidth] = useState(MaxContentWidth);
  const onSlotLayout = (e: LayoutChangeEvent) => setSlotWidth(e.nativeEvent.layout.width);
  const contentWidth = Math.min(slotWidth, MaxContentWidth);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TALKS.filter((talk) => {
      if (category !== 'ALL' && talk.category !== category) return false;
      if (!q) return true;
      return talk.title.toLowerCase().includes(q) || talk.speaker.toLowerCase().includes(q);
    });
  }, [query, category]);

  const header = (
    <View style={{ width: slotWidth }}>
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

      <View style={styles.controls}>
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
          {results.length.toLocaleString()} {results.length === 1 ? 'talk' : 'talks'}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} onLayout={onSlotLayout}>
      <FlatList
        data={results}
        keyExtractor={(talk) => talk.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <ThemedText
            type="body"
            themeColor="textSecondary"
            style={[styles.emptyState, { width: contentWidth }]}>
            No talks match that search and filter combination.
          </ThemedText>
        }
        renderItem={({ item }) => {
          const status = getStatus(item.id);
          return (
            <View style={[styles.cardWrap, { width: contentWidth }]}>
              <TalkCard
                category={item.category}
                title={item.title}
                meta={formatTalkMeta(item)}
                statusLabel={status.isStudied ? 'Studied' : 'Not studied'}
                favorite={status.isFavorite}
                onToggleFavorite={() => setFavorite(item.id, !status.isFavorite)}
                onPress={() => router.push({ pathname: '/talk/[id]', params: { id: item.id } })}
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  list: {
    flex: 1,
  },
  listContent: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.xxxl,
    gap: Spacing.md,
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
  controls: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  cardWrap: {
    paddingHorizontal: Spacing.xl,
  },
  emptyState: {
    paddingHorizontal: Spacing.xl,
  },
});
