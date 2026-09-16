import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, type LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { HeroBanner, HeroTextGlow } from '@/components/ui/hero-banner';
import { Pill } from '@/components/ui/pill';
import { SearchField } from '@/components/ui/search-field';
import { TalkCard } from '@/components/ui/talk-card';
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Radii,
  SessionCategoryTag,
  SessionTagColors,
  Spacing,
  WebSidebarWidth,
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

// Newest first — derived from the real dataset rather than a hardcoded
// range, so it stays correct as the CSV gets updated with new conferences.
const YEAR_FILTERS = Array.from(new Set(TALKS.map((t) => t.year))).sort((a, b) => b - a);

type Conference = 4 | 10 | 'ALL';
type DropdownKind = 'year' | 'conference' | 'session' | null;

const CONFERENCE_LABELS: Record<4 | 10, string> = { 4: 'April', 10: 'October' };

export default function BrowseScreen() {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<number | 'ALL'>('ALL');
  const [conference, setConference] = useState<Conference>('ALL');
  const [category, setCategory] = useState<SessionCategory | 'ALL'>('ALL');
  const [openDropdown, setOpenDropdown] = useState<DropdownKind>(null);
  const { getStatus, setFavorite } = useTalkStatus();
  const router = useRouter();
  // FlatList's per-item cell wrapper on react-native-web doesn't resolve
  // width:'100%' the way ScrollView content does, so cards shrink-wrap
  // instead of filling the column — measure the real slot width instead
  // of relying on a percentage.
  const [slotWidth, setSlotWidth] = useState(MaxContentWidth);
  const onSlotLayout = (e: LayoutChangeEvent) => setSlotWidth(e.nativeEvent.layout.width);
  const contentWidth = Math.min(slotWidth, MaxContentWidth);

  // Cascading: picking a year narrows which conferences (April/October)
  // actually have talks that year; picking a conference on top of that
  // narrows which sessions actually occurred in it. Each level only
  // offers choices that are real given what's already picked above it —
  // not just the same fixed list every time.
  const conferenceOptions = useMemo(() => {
    if (year === 'ALL') return [];
    const months = new Set(TALKS.filter((t) => t.year === year).map((t) => t.month));
    return ([4, 10] as const).filter((m) => months.has(m));
  }, [year]);

  const sessionOptions = useMemo(() => {
    if (year === 'ALL' || conference === 'ALL') return [];
    const cats = new Set(
      TALKS.filter((t) => t.year === year && t.month === conference).map((t) => t.category),
    );
    return CATEGORY_FILTERS.filter((c) => cats.has(c));
  }, [year, conference]);

  const selectYear = (y: number | 'ALL') => {
    setYear(y);
    setConference('ALL');
    setCategory('ALL');
    setOpenDropdown(null);
  };
  const selectConference = (m: Conference) => {
    setConference(m);
    setCategory('ALL');
    setOpenDropdown(null);
  };
  const selectCategory = (c: SessionCategory | 'ALL') => {
    setCategory(c);
    setOpenDropdown(null);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TALKS.filter((talk) => {
      if (year !== 'ALL' && talk.year !== year) return false;
      if (conference !== 'ALL' && talk.month !== conference) return false;
      if (category !== 'ALL' && talk.category !== category) return false;
      if (!q) return true;
      return talk.title.toLowerCase().includes(q) || talk.speaker.toLowerCase().includes(q);
    });
  }, [query, category, conference, year]);

  const header = (
    // alignItems:'center' matters here — the FlatList's own centering
    // (contentContainerStyle below) only reaches its DIRECT children
    // (this whole header, and each talk-card row). Search/dropdowns/
    // count live nested one level deeper inside `controls`, which the
    // FlatList's centering can't reach — without this, `controls`
    // (capped at MaxContentWidth) stayed pinned to the left edge of the
    // full-width header instead of lining up with the cards below it.
    <View style={{ width: slotWidth, alignItems: 'center' }}>
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

        <View style={styles.dropdownRow}>
          <DropdownTrigger
            label="Year"
            value={year === 'ALL' ? undefined : String(year)}
            onPress={() => setOpenDropdown('year')}
          />
          <DropdownTrigger
            label="Conference"
            value={conference === 'ALL' ? undefined : CONFERENCE_LABELS[conference]}
            disabled={year === 'ALL'}
            onPress={() => setOpenDropdown('conference')}
          />
          <DropdownTrigger
            label="Session"
            value={category === 'ALL' ? undefined : SessionCategoryTag[category].label}
            disabled={conference === 'ALL'}
            onPress={() => setOpenDropdown('session')}
          />
        </View>

        <ThemedText type="metadata" themeColor="textSecondary">
          {results.length.toLocaleString()} {results.length === 1 ? 'talk' : 'talks'}
        </ThemedText>
      </View>
    </View>
  );

  const dropdownModal = (
    <Modal
      visible={openDropdown !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setOpenDropdown(null)}>
      <Pressable style={styles.modalOverlay} onPress={() => setOpenDropdown(null)}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card style={styles.dropdownCard}>
            {openDropdown === 'year' && (
              <>
                <ThemedText type="section">Year</ThemedText>
                {/* Fixed height, not maxHeight — maxHeight on a ScrollView
                    didn't reliably size it in this nested Modal/Pressable
                    context (confirmed live: it collapsed to a sliver,
                    clipping every pill down to a thin curved edge). All
                    three lists use the same scrollable treatment now, not
                    just this one — a plain View for the shorter two
                    clipped instead of scrolling once content didn't fit,
                    making the rest of the list unreachable. */}
                <ScrollView style={styles.dropdownScroll} contentContainerStyle={styles.dropdownGrid}>
                  <Pill label="All years" selected={year === 'ALL'} onPress={() => selectYear('ALL')} />
                  {YEAR_FILTERS.map((y) => (
                    <Pill key={y} label={String(y)} selected={year === y} onPress={() => selectYear(y)} />
                  ))}
                </ScrollView>
              </>
            )}

            {openDropdown === 'conference' && (
              <>
                <ThemedText type="section">Conference — {year}</ThemedText>
                {/* Smaller fixed height than Year/Session — this list is
                    structurally always exactly 3 options (All, April,
                    October; there are only ever two real conferences a
                    year), so the same 280px used for the other two would
                    just leave most of the box empty. */}
                <ScrollView style={styles.dropdownScrollSmall} contentContainerStyle={styles.dropdownGrid}>
                  <Pill
                    label="All conferences"
                    selected={conference === 'ALL'}
                    onPress={() => selectConference('ALL')}
                  />
                  {conferenceOptions.map((m) => (
                    <Pill
                      key={m}
                      label={CONFERENCE_LABELS[m]}
                      selected={conference === m}
                      onPress={() => selectConference(m)}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {openDropdown === 'session' && (
              <>
                <ThemedText type="section">
                  Session — {CONFERENCE_LABELS[conference as 4 | 10]} {year}
                </ThemedText>
                <ScrollView style={styles.dropdownScroll} contentContainerStyle={styles.dropdownGrid}>
                  <Pill label="All sessions" selected={category === 'ALL'} onPress={() => selectCategory('ALL')} />
                  {sessionOptions.map((cat) => {
                    const { label, color } = SessionCategoryTag[cat];
                    return (
                      <Pill
                        key={cat}
                        label={label}
                        selected={category === cat}
                        onPress={() => selectCategory(cat)}
                        color={SessionTagColors[color]}
                      />
                    );
                  })}
                </ScrollView>
              </>
            )}
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
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
      {dropdownModal}
    </SafeAreaView>
  );
}

function DropdownTrigger({
  label,
  value,
  disabled,
  onPress,
}: {
  label: string;
  value?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.dropdownTrigger, disabled && styles.dropdownTriggerDisabled]}>
      <ThemedText
        type="control"
        style={[styles.dropdownTriggerLabel, !!value && styles.dropdownTriggerLabelActive]}
        numberOfLines={1}>
        {value ?? label}
      </ThemedText>
      <ThemedText type="control" style={styles.dropdownChevron}>
        ▾
      </ThemedText>
    </Pressable>
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
    ...HeroTextGlow,
  },
  heroSubhead: {
    // Darker than the app's usual secondaryInk gray — scoped to just
    // the hero subhead, not the shared token used elsewhere.
    color: '#47444B',
    ...HeroTextGlow,
  },
  controls: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dropdownTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.surface,
  },
  dropdownTriggerDisabled: {
    opacity: 0.45,
  },
  dropdownTriggerLabel: {
    color: Palette.secondaryInk,
    flexShrink: 1,
  },
  dropdownTriggerLabelActive: {
    color: Palette.purpleInk,
  },
  dropdownChevron: {
    color: Palette.secondaryInk,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 24, 69, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingRight: Spacing.xl,
    // A full-screen Modal overlays the whole browser window on web, but
    // the talk list actually sits to the right of the persistent
    // sidebar — centering symmetrically (like native, which has no
    // sidebar) put the dropdown noticeably left of what's on screen.
    // Extra left padding equal to the sidebar's width shifts the
    // effective center exactly enough to line back up with the content
    // column, regardless of window width.
    paddingLeft: Platform.OS === 'web' ? Spacing.xl + WebSidebarWidth : Spacing.xl,
  },
  dropdownCard: {
    width: '100%',
    // Was 380 — read as a near-full-width panel on a phone rather than a
    // compact dropdown menu. Narrower now so it visually reads as a menu
    // popping up from its trigger, not another full-screen sheet.
    maxWidth: 300,
    maxHeight: '70%',
    gap: Spacing.md,
    // Without this, the fixed-height year list (below) can be taller
    // than the card's own maxHeight budget once the title/padding are
    // subtracted — confirmed live: extra pills spilled out past the
    // card's rounded edge instead of staying contained and scrollable.
    overflow: 'hidden',
  },
  dropdownScroll: {
    // A fixed height, not maxHeight — maxHeight on a ScrollView didn't
    // reliably size it in this nested-Pressable-in-a-Modal context
    // (confirmed live: it collapsed to a sliver, clipping every pill
    // down to a thin curved edge). An explicit height is far more
    // reliably respected than maxHeight is for ScrollView specifically.
    // Used for Year (up to 57 options) and Session (up to 11) — both can
    // have enough pills to actually fill this and need to scroll.
    height: 280,
  },
  dropdownScrollSmall: {
    // Conference only ever has 3 options — see comment at its usage.
    height: 120,
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cardWrap: {
    paddingHorizontal: Spacing.xl,
  },
  emptyState: {
    paddingHorizontal: Spacing.xl,
  },
});
