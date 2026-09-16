import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  Palette,
  Radii,
  SessionCategoryTag,
  SessionTagColors,
  Spacing,
  WebSidebarWidth,
  type SessionCategory,
} from '@/constants/theme';
import { TALKS, type Talk } from '@/data/talks';

/**
 * Shared Year → Conference → Session cascading-dropdown filter, factored
 * out of Browse (its original, still-separate implementation) so Saved
 * and Progress can reuse the exact same behavior and look instead of
 * duplicating the whole modal+state block a second and third time.
 *
 * Year/Session option lists are always derived from the FULL dataset,
 * not from whatever subset of `talks` a given screen passes in — so
 * Saved's dropdowns list years/sessions in the same canonical order
 * Browse does, even though "how many results that leaves" differs per
 * screen. Only Conference/Session *availability* (which ones actually
 * have matches) is scoped to the passed-in talks + current selection.
 */

export const CONFERENCE_LABELS: Record<4 | 10, string> = { 4: 'April', 10: 'October' };

const ALL_YEARS = Array.from(new Set(TALKS.map((t) => t.year))).sort((a, b) => b - a);
const ALL_CATEGORIES = (Object.keys(SessionCategoryTag) as SessionCategory[]).filter((cat) =>
  TALKS.some((t) => t.category === cat),
);

type DropdownKind = 'year' | 'conference' | 'session' | null;

export function useConferenceFilters(talks: Talk[]) {
  const [year, setYearState] = useState<number | 'ALL'>('ALL');
  const [conference, setConferenceState] = useState<4 | 10 | 'ALL'>('ALL');
  const [category, setCategoryState] = useState<SessionCategory | 'ALL'>('ALL');
  const [openDropdown, setOpenDropdown] = useState<DropdownKind>(null);

  const conferenceOptions = useMemo(() => {
    if (year === 'ALL') return [];
    const months = new Set(talks.filter((t) => t.year === year).map((t) => t.month));
    return ([4, 10] as const).filter((m) => months.has(m));
  }, [talks, year]);

  const sessionOptions = useMemo(() => {
    if (year === 'ALL' || conference === 'ALL') return [];
    const cats = new Set(talks.filter((t) => t.year === year && t.month === conference).map((t) => t.category));
    return ALL_CATEGORIES.filter((c) => cats.has(c));
  }, [talks, year, conference]);

  const setYear = (y: number | 'ALL') => {
    setYearState(y);
    setConferenceState('ALL');
    setCategoryState('ALL');
    setOpenDropdown(null);
  };
  const setConference = (m: 4 | 10 | 'ALL') => {
    setConferenceState(m);
    setCategoryState('ALL');
    setOpenDropdown(null);
  };
  const setCategory = (c: SessionCategory | 'ALL') => {
    setCategoryState(c);
    setOpenDropdown(null);
  };

  const filteredTalks = useMemo(
    () =>
      talks.filter((t) => {
        if (year !== 'ALL' && t.year !== year) return false;
        if (conference !== 'ALL' && t.month !== conference) return false;
        if (category !== 'ALL' && t.category !== category) return false;
        return true;
      }),
    [talks, year, conference, category],
  );

  return {
    year,
    conference,
    category,
    conferenceOptions,
    sessionOptions,
    openDropdown,
    setOpenDropdown,
    setYear,
    setConference,
    setCategory,
    filteredTalks,
  };
}

export type ConferenceFiltersState = ReturnType<typeof useConferenceFilters>;

export function ConferenceFilterBar({ state }: { state: ConferenceFiltersState }) {
  return (
    <View style={styles.dropdownRow}>
      <DropdownTrigger
        label="Year"
        value={state.year === 'ALL' ? undefined : String(state.year)}
        onPress={() => state.setOpenDropdown('year')}
      />
      <DropdownTrigger
        label="Conference"
        value={state.conference === 'ALL' ? undefined : CONFERENCE_LABELS[state.conference]}
        disabled={state.year === 'ALL'}
        onPress={() => state.setOpenDropdown('conference')}
      />
      <DropdownTrigger
        label="Session"
        value={state.category === 'ALL' ? undefined : SessionCategoryTag[state.category].label}
        disabled={state.conference === 'ALL'}
        onPress={() => state.setOpenDropdown('session')}
      />
    </View>
  );
}

export function ConferenceFilterModal({ state }: { state: ConferenceFiltersState }) {
  const {
    openDropdown,
    setOpenDropdown,
    year,
    conference,
    category,
    conferenceOptions,
    sessionOptions,
    setYear,
    setConference,
    setCategory,
  } = state;

  return (
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
                <ScrollView style={styles.dropdownScroll} contentContainerStyle={styles.dropdownGrid}>
                  <Pill label="All years" selected={year === 'ALL'} onPress={() => setYear('ALL')} />
                  {ALL_YEARS.map((y) => (
                    <Pill key={y} label={String(y)} selected={year === y} onPress={() => setYear(y)} />
                  ))}
                </ScrollView>
              </>
            )}

            {openDropdown === 'conference' && (
              <>
                <ThemedText type="section">Conference — {year}</ThemedText>
                {/* Structurally always exactly 3 options (All/April/
                    October) — a smaller fixed height than Year/Session so
                    it doesn't float in mostly-empty space. */}
                <ScrollView style={styles.dropdownScrollSmall} contentContainerStyle={styles.dropdownGrid}>
                  <Pill
                    label="All conferences"
                    selected={conference === 'ALL'}
                    onPress={() => setConference('ALL')}
                  />
                  {conferenceOptions.map((m) => (
                    <Pill
                      key={m}
                      label={CONFERENCE_LABELS[m]}
                      selected={conference === m}
                      onPress={() => setConference(m)}
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
                  <Pill label="All sessions" selected={category === 'ALL'} onPress={() => setCategory('ALL')} />
                  {sessionOptions.map((cat) => {
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
              </>
            )}
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
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
    maxWidth: 300,
    maxHeight: '70%',
    gap: Spacing.md,
    overflow: 'hidden',
  },
  dropdownScroll: {
    height: 280,
  },
  dropdownScrollSmall: {
    height: 120,
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
