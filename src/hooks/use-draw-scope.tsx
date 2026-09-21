import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import type { Talk } from '@/data/talks';
import { useAuth } from '@/hooks/use-auth';
import { useTalkStatus } from '@/hooks/use-talk-status';
import { ALL_CATEGORIES, ALL_YEARS, defaultScope, talksInScope, type DrawScope } from '@/lib/draw-scope';

const STORAGE_KEY = 'gctp.drawScope.v1';

type DrawScopeContextValue = {
  /** The scope as chosen — `unstudiedOnly` here is the effective value (see below). */
  scope: DrawScope;
  update: (partial: Partial<DrawScope>) => void;
  reset: () => void;
  /** Replace the whole scope (anything not given goes back to its default). */
  apply: (scope: Partial<DrawScope>) => void;
  /** Talks that match the current scope, right now. */
  matches: Talk[];
  /**
   * Only computed when nothing matches while "unstudied only" is on: how many
   * talks the scope WOULD match if studied ones were included. Non-zero means
   * "you've studied everything here" rather than "this scope is empty".
   */
  studiedInScopeCount: number;
};

const DrawScopeContext = createContext<DrawScopeContextValue | null>(null);

// Expo Router's web build prerenders in Node where AsyncStorage's web shim
// would crash — same guard as src/lib/supabase.ts.
const isServerRender = Platform.OS === 'web' && typeof window === 'undefined';

/** Coerce whatever was saved into a valid scope; ignore anything unrecognised. */
function parseSaved(raw: string | null): { scope: DrawScope; unstudiedOverride: boolean | null } | null {
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw);
    const base = defaultScope();
    const categories = Array.isArray(saved.scope?.categories)
      ? saved.scope.categories.filter((c: string) => (ALL_CATEGORIES as string[]).includes(c))
      : [];
    const months = Array.isArray(saved.scope?.months)
      ? saved.scope.months.filter((m: number) => m === 4 || m === 10)
      : [];
    const year = saved.scope?.year;
    return {
      scope: {
        year: typeof year === 'number' && ALL_YEARS.includes(year) ? year : 'ALL',
        months: months.length > 0 ? months : base.months,
        categories: categories.length > 0 ? categories : base.categories,
        speakers: Array.isArray(saved.scope?.speakers)
          ? saved.scope.speakers.filter((s: unknown) => typeof s === 'string')
          : [],
        unstudiedOnly: false, // derived, see effective scope below
        savedOnly: saved.scope?.savedOnly === true,
      },
      unstudiedOverride: typeof saved.unstudiedOverride === 'boolean' ? saved.unstudiedOverride : null,
    };
  } catch {
    return null;
  }
}

/**
 * Holds the user's Draw scope for the whole app, so the /draw screen and the
 * "Draw another talk" link on a talk both use the same one — and it's
 * remembered on the device between visits and app launches.
 *
 * "Unstudied only" isn't stored as a plain boolean: until the user touches
 * it, it follows sign-in state (on when signed in, off for guests), so a
 * user who signs in later gets the signed-in default rather than a stale
 * "off" saved while signed out.
 */
export function DrawScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { studiedIdsByRecency, favoriteIds } = useTalkStatus();
  const [scope, setScope] = useState<DrawScope>(defaultScope);
  const [unstudiedOverride, setUnstudiedOverride] = useState<boolean | null>(null);
  const [hydrated, setHydrated] = useState(false);
  // Set once anything (the user, or a /draw link) has set the scope, so the
  // slower read of the saved scope on app start can't overwrite it.
  const changedRef = useRef(false);

  useEffect(() => {
    if (isServerRender) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const saved = parseSaved(raw);
        if (saved && !changedRef.current) {
          setScope(saved.scope);
          setUnstudiedOverride(saved.unstudiedOverride);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || isServerRender) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ scope, unstudiedOverride })).catch(() => {});
  }, [hydrated, scope, unstudiedOverride]);

  const effectiveScope = useMemo<DrawScope>(
    () => ({ ...scope, unstudiedOnly: unstudiedOverride ?? !!user }),
    [scope, unstudiedOverride, user],
  );

  const matches = useMemo(
    () =>
      talksInScope(effectiveScope, {
        studiedIds: new Set(studiedIdsByRecency),
        savedIds: new Set(favoriteIds),
      }),
    [effectiveScope, studiedIdsByRecency, favoriteIds],
  );

  const studiedInScopeCount = useMemo(() => {
    if (matches.length > 0 || !effectiveScope.unstudiedOnly) return 0;
    return talksInScope(
      { ...effectiveScope, unstudiedOnly: false },
      { studiedIds: new Set(studiedIdsByRecency), savedIds: new Set(favoriteIds) },
    ).length;
  }, [matches, effectiveScope, studiedIdsByRecency, favoriteIds]);

  const update = useCallback((partial: Partial<DrawScope>) => {
    changedRef.current = true;
    const { unstudiedOnly, ...rest } = partial;
    if (unstudiedOnly !== undefined) setUnstudiedOverride(unstudiedOnly);
    if (Object.keys(rest).length > 0) setScope((s) => ({ ...s, ...rest }));
  }, []);

  const reset = useCallback(() => {
    changedRef.current = true;
    setScope(defaultScope());
    setUnstudiedOverride(null);
  }, []);

  const apply = useCallback((next: Partial<DrawScope>) => {
    changedRef.current = true;
    const { unstudiedOnly, ...rest } = next;
    setScope({ ...defaultScope(), ...rest });
    setUnstudiedOverride(unstudiedOnly ?? null);
  }, []);

  const value = useMemo(
    () => ({ scope: effectiveScope, update, reset, apply, matches, studiedInScopeCount }),
    [effectiveScope, update, reset, apply, matches, studiedInScopeCount],
  );

  return <DrawScopeContext.Provider value={value}>{children}</DrawScopeContext.Provider>;
}

export function useDrawScope() {
  const ctx = useContext(DrawScopeContext);
  if (!ctx) throw new Error('useDrawScope must be used within a DrawScopeProvider');
  return ctx;
}
