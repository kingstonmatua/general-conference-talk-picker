import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { SearchField } from '@/components/ui/search-field';
import { MaxContentWidth, Palette, Radii, SessionCategoryTag, SessionTagColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useDrawRandomTalk } from '@/hooks/use-draw-random-talk';
import { useDrawScope } from '@/hooks/use-draw-scope';
import { useTalkStatus } from '@/hooks/use-talk-status';
import {
  ALL_CATEGORIES,
  ALL_YEARS,
  paramsToScope,
  scopeToParams,
  SPEAKER_OPTIONS,
  type DrawScopeParams,
} from '@/lib/draw-scope';

type DropdownKind = 'year' | 'conference' | 'session' | 'speaker' | null;

const MONTH_LABELS: Record<4 | 10, string> = { 4: 'April', 10: 'October' };
const CONFERENCE_OPTIONS: { label: string; months: (4 | 10)[] }[] = [
  { label: 'Both', months: [4, 10] },
  { label: 'April', months: [4] },
  { label: 'October', months: [10] },
];
const SPEAKER_LIST_LIMIT = 50;
const SPEAKER_SUGGESTED_COUNT = 20;

const SPEAKER_NAME_BY_KEY = new Map(SPEAKER_OPTIONS.map((s) => [s.key, s.name]));
const SPEAKERS_BY_TALK_COUNT = [...SPEAKER_OPTIONS].sort((a, b) => b.count - a.count);

/**
 * Scope picker for Draw: the user chooses which slice of the library a
 * random draw may come from, sees a live count of matching talks, then
 * draws. The scope lives in DrawScopeProvider (remembered on the device).
 * Not yet in the URL or reachable from the app's Draw buttons — see
 * DRAW_PAGE_PLAN.md.
 */
export default function DrawScreen() {
  const router = useRouter();
  const { user, promptSignIn } = useAuth();
  const { scope, update, reset, apply, matches, studiedInScopeCount } = useDrawScope();
  const { favoriteIds } = useTalkStatus();
  const params = useLocalSearchParams<DrawScopeParams>();
  const [urlReady, setUrlReady] = useState(false);
  const drawRandomTalk = useDrawRandomTalk();
  const [openDropdown, setOpenDropdown] = useState<DropdownKind>(null);
  const [speakerQuery, setSpeakerQuery] = useState('');
  const unstudiedOnly = scope.unstudiedOnly;

  // A link like /draw?year=2015&speakers=... opens with exactly that scope
  // (overriding the remembered one). Runs once on arrival.
  useEffect(() => {
    const fromUrl = paramsToScope(params);
    if (fromUrl) apply(fromUrl);
    setUrlReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL showing the current scope so it can be copied or shared.
  // Waits for the arrival effect above so it can't wipe an incoming link.
  const signedIn = !!user;
  useEffect(() => {
    if (!urlReady) return;
    router.setParams(scopeToParams(scope, signedIn));
  }, [urlReady, scope, signedIn, router]);

  const allSessionsSelected = scope.categories.length === ALL_CATEGORIES.length;

  // "All sessions" and individual sessions are mutually exclusive in the UI:
  // with All on, picking a chip narrows to just that one; removing the last
  // chip falls back to All rather than leaving nothing selected.
  const toggleCategory = (c: (typeof ALL_CATEGORIES)[number]) => {
    if (allSessionsSelected) return update({ categories: [c] });
    const next = scope.categories.includes(c) ? scope.categories.filter((x) => x !== c) : [...scope.categories, c];
    update({ categories: next.length === 0 ? [...ALL_CATEGORIES] : next });
  };

  const toggleSpeaker = (key: string) =>
    update({
      speakers: scope.speakers.includes(key) ? scope.speakers.filter((k) => k !== key) : [...scope.speakers, key],
    });

  const resetScope = () => {
    reset();
    setSpeakerQuery('');
  };

  // Why is nothing matching? Three different situations, three different fixes.
  const allStudied = matches.length === 0 && studiedInScopeCount > 0;
  const noSavedTalks = matches.length === 0 && !allStudied && scope.savedOnly && favoriteIds.length === 0;

  const widenScope = () => {
    update({
      year: 'ALL',
      months: [4, 10],
      categories: [...ALL_CATEGORIES],
      speakers: [],
      savedOnly: false,
    });
    setSpeakerQuery('');
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
    setSpeakerQuery('');
  };

  const speakerList = useMemo(() => {
    const q = speakerQuery.trim().toLowerCase();
    if (!q) return SPEAKERS_BY_TALK_COUNT.slice(0, SPEAKER_SUGGESTED_COUNT);
    return SPEAKER_OPTIONS.filter((s) => s.name.toLowerCase().includes(q)).slice(0, SPEAKER_LIST_LIMIT);
  }, [speakerQuery]);

  const draw = () => {
    if (matches.length === 0) return;
    drawRandomTalk();
  };

  const conferenceLabel = scope.months.length === 2 ? 'Both' : MONTH_LABELS[scope.months[0]];
  const sessionLabel =
    allSessionsSelected
      ? 'All sessions'
      : scope.categories.length === 1
        ? SessionCategoryTag[scope.categories[0]].label
        : `${scope.categories.length} sessions`;
  const speakerLabel =
    scope.speakers.length === 0
      ? 'All speakers'
      : scope.speakers.length === 1
        ? (SPEAKER_NAME_BY_KEY.get(scope.speakers[0]) ?? '1 speaker')
        : `${scope.speakers.length} speakers`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
            <Ionicons name="chevron-back" size={18} color={Palette.secondaryInk} />
            <ThemedText type="control" themeColor="textSecondary">
              Back
            </ThemedText>
          </Pressable>

          <View style={styles.titleBlock}>
            <ThemedText type="display">Draw a talk</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              Choose where your talk comes from, then draw.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="section">Quick picks</ThemedText>
            <View style={styles.chips}>
              {user ? (
                <>
                  <Pill label="Unstudied" selected={unstudiedOnly} onPress={() => update({ unstudiedOnly: !unstudiedOnly })} />
                  <Pill label="Saved" selected={scope.savedOnly} onPress={() => update({ savedOnly: !scope.savedOnly })} />
                </>
              ) : (
                // Guests have no studied or saved talks to filter by — offer sign-up instead.
                <Button label="Sign up to track studies and save talks" variant="secondary" onPress={promptSignIn} />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="section">Scope</ThemedText>
            <View style={styles.dropdownRow}>
              <DropdownField
                label="Year"
                value={scope.year === 'ALL' ? 'All years' : String(scope.year)}
                active={scope.year !== 'ALL'}
                onPress={() => setOpenDropdown('year')}
              />
              <DropdownField
                label="Conference"
                value={conferenceLabel}
                active={scope.months.length !== 2}
                onPress={() => setOpenDropdown('conference')}
              />
            </View>
            <View style={styles.dropdownRow}>
              <DropdownField
                label="Session"
                value={sessionLabel}
                active={!allSessionsSelected}
                onPress={() => setOpenDropdown('session')}
              />
              <DropdownField
                label="Speaker"
                value={speakerLabel}
                active={scope.speakers.length > 0}
                onPress={() => setOpenDropdown('speaker')}
              />
            </View>
          </View>

          {matches.length === 0 && (
            <Card style={styles.emptyCard}>
              <ThemedText type="section">
                {allStudied
                  ? 'You’ve studied every talk in this scope.'
                  : noSavedTalks
                    ? 'You haven’t saved any talks yet.'
                    : 'No talks match this scope.'}
              </ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                {allStudied
                  ? 'Include the ones you’ve already studied, or widen the scope to draw something new.'
                  : noSavedTalks
                    ? 'Save a talk from its page, or draw from everything instead.'
                    : 'Try widening the scope — a filter or two is probably too narrow.'}
              </ThemedText>
              <View style={styles.emptyActions}>
                {allStudied && (
                  <Button label="Include studied talks" variant="primary" onPress={() => update({ unstudiedOnly: false })} />
                )}
                <Button label="Widen scope" variant={allStudied ? 'secondary' : 'primary'} onPress={widenScope} />
              </View>
            </Card>
          )}

          <Pressable onPress={resetScope} hitSlop={8} style={styles.resetRow}>
            <ThemedText type="control" themeColor="textSecondary">
              Reset to everything
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <ThemedText type="section" style={styles.matchCount}>
            {matches.length.toLocaleString()} {matches.length === 1 ? 'talk matches' : 'talks match'}
          </ThemedText>
          <Button
            label="Draw"
            variant="primary"
            disabled={matches.length === 0}
            onPress={draw}
            style={styles.drawButton}
          />
        </View>
      </View>

      <Modal visible={openDropdown !== null} transparent animationType="fade" onRequestClose={closeDropdown}>
        <Pressable style={styles.modalOverlay} onPress={closeDropdown}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCardWrap}>
            <Card style={styles.dropdownCard}>
              {openDropdown === 'year' && (
                <>
                  <ThemedText type="section">Year</ThemedText>
                  <ScrollView style={styles.dropdownScroll} contentContainerStyle={styles.chips}>
                    <Pill
                      label="All years"
                      selected={scope.year === 'ALL'}
                      onPress={() => {
                        update({ year: 'ALL' });
                        closeDropdown();
                      }}
                    />
                    {[...ALL_YEARS].reverse().map((y) => (
                      <Pill
                        key={y}
                        label={String(y)}
                        selected={scope.year === y}
                        onPress={() => {
                          update({ year: y });
                          closeDropdown();
                        }}
                      />
                    ))}
                  </ScrollView>
                </>
              )}

              {openDropdown === 'conference' && (
                <>
                  <ThemedText type="section">Conference</ThemedText>
                  <View style={styles.chips}>
                    {CONFERENCE_OPTIONS.map((opt) => (
                      <Pill
                        key={opt.label}
                        label={opt.label}
                        selected={
                          opt.months.length === scope.months.length && opt.months.every((m) => scope.months.includes(m))
                        }
                        onPress={() => {
                          update({ months: opt.months });
                          closeDropdown();
                        }}
                      />
                    ))}
                  </View>
                </>
              )}

              {openDropdown === 'session' && (
                <>
                  <ThemedText type="section">Session</ThemedText>
                  <ScrollView style={styles.dropdownScroll} contentContainerStyle={styles.chips}>
                    <Pill
                      label="All sessions"
                      selected={allSessionsSelected}
                      onPress={() => update({ categories: [...ALL_CATEGORIES] })}
                    />
                    {ALL_CATEGORIES.map((cat) => {
                      const { label, color } = SessionCategoryTag[cat];
                      return (
                        <Pill
                          key={cat}
                          label={label}
                          selected={!allSessionsSelected && scope.categories.includes(cat)}
                          onPress={() => toggleCategory(cat)}
                          color={SessionTagColors[color]}
                        />
                      );
                    })}
                  </ScrollView>
                  <Button label="Done" variant="primary" onPress={closeDropdown} style={styles.doneButton} />
                </>
              )}

              {openDropdown === 'speaker' && (
                <>
                  <ThemedText type="section">Speaker</ThemedText>
                  <SearchField value={speakerQuery} onChangeText={setSpeakerQuery} placeholder="Search speakers" />
                  <ScrollView style={styles.dropdownScroll}>
                    {speakerQuery.trim() === '' && (
                      <ThemedText type="metadata" themeColor="textSecondary" style={styles.speakerHint}>
                        Most talks — search to find anyone else
                      </ThemedText>
                    )}
                    {speakerList.map((s) => {
                      const selected = scope.speakers.includes(s.key);
                      return (
                        <Pressable
                          key={s.key}
                          onPress={() => toggleSpeaker(s.key)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={styles.speakerRow}>
                          <View style={styles.speakerText}>
                            <ThemedText type="body" style={selected && styles.speakerSelected}>
                              {s.name}
                            </ThemedText>
                            <ThemedText type="metadata" themeColor="textSecondary">
                              {s.count} {s.count === 1 ? 'talk' : 'talks'}
                            </ThemedText>
                          </View>
                          {selected && <Ionicons name="checkmark" size={20} color={Palette.conferencePurple} />}
                        </Pressable>
                      );
                    })}
                    {speakerList.length === 0 && (
                      <ThemedText type="metadata" themeColor="textSecondary" style={styles.speakerHint}>
                        No speakers match that search.
                      </ThemedText>
                    )}
                  </ScrollView>
                  <View style={styles.speakerFooter}>
                    {scope.speakers.length > 0 ? (
                      <Pressable onPress={() => update({ speakers: [] })} hitSlop={8}>
                        <ThemedText type="control" themeColor="textSecondary">
                          Clear ({scope.speakers.length})
                        </ThemedText>
                      </Pressable>
                    ) : (
                      <View />
                    )}
                    <Button label="Done" variant="primary" onPress={closeDropdown} />
                  </View>
                </>
              )}
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DropdownField({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="metadata" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable onPress={onPress} accessibilityLabel={`${label}, ${value}`} style={styles.trigger}>
        <ThemedText type="control" style={[styles.triggerValue, active && styles.triggerValueActive]} numberOfLines={1}>
          {value}
        </ThemedText>
        <ThemedText type="control" style={styles.chevron}>
          ▾
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  titleBlock: {
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  field: {
    flex: 1,
    gap: Spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    backgroundColor: Palette.surface,
  },
  triggerValue: {
    color: Palette.secondaryInk,
    flexShrink: 1,
  },
  triggerValueActive: {
    color: Palette.purpleInk,
  },
  chevron: {
    color: Palette.secondaryInk,
  },
  emptyCard: {
    gap: Spacing.md,
  },
  emptyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  resetRow: {
    alignSelf: 'flex-start',
  },
  footer: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.warmBorder,
  },
  footerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  matchCount: {
    flexShrink: 1,
  },
  drawButton: {
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 24, 69, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCardWrap: {
    width: '100%',
    alignItems: 'center',
  },
  dropdownCard: {
    width: '100%',
    maxWidth: 340,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  dropdownScroll: {
    // Fixed height, not maxHeight — see the same note in Browse's dropdowns.
    height: 280,
  },
  doneButton: {
    alignSelf: 'flex-end',
  },
  speakerHint: {
    paddingVertical: Spacing.sm,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.warmBorder,
  },
  speakerText: {
    flex: 1,
  },
  speakerSelected: {
    color: Palette.conferencePurple,
  },
  speakerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
