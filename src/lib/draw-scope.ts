import { SessionCategoryTag, type SessionCategory } from '@/constants/theme';
import { TALKS, type Talk } from '@/data/talks';

/**
 * The "scope" a user picks on /draw before drawing: which slice of the
 * talk library a random draw may come from. Pure data + filtering logic,
 * no React — the screen owns state, this owns the rules.
 */

export type DrawScope = {
  /** A single conference year, or 'ALL' for every year. */
  year: number | 'ALL';
  /** Conference months included: 4 = April, 10 = October. */
  months: (4 | 10)[];
  categories: SessionCategory[];
  /** Normalized speaker keys (see speakerKey). Empty = all speakers. */
  speakers: string[];
  unstudiedOnly: boolean;
  savedOnly: boolean;
};

export const ALL_YEARS = Array.from(new Set(TALKS.map((t) => t.year))).sort((a, b) => a - b);

// Only categories that actually have talks (YOUNG_WOMEN is defined but empty).
export const ALL_CATEGORIES = (Object.keys(SessionCategoryTag) as SessionCategory[]).filter((cat) =>
  TALKS.some((t) => t.category === cat),
);

export function defaultScope(): DrawScope {
  return {
    year: 'ALL',
    months: [4, 10],
    categories: [...ALL_CATEGORIES],
    speakers: [],
    unstudiedOnly: false,
    savedOnly: false,
  };
}

// ─── Speakers ────────────────────────────────────────────────────────────────

const TITLE_PREFIX = /^(elder|president|sister|bishop|brother|bro\.|sis\.)\s+/i;

/**
 * Collapses spelling variants of one person's name to one key — case,
 * periods, leading titles ("Elder"), and repeated spaces — so e.g.
 * "Jack H Goaslind Jr." and "Jack H. Goaslind Jr." are one speaker.
 */
export function speakerKey(name: string): string {
  return name
    .trim()
    .replace(TITLE_PREFIX, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export type SpeakerOption = { key: string; name: string; count: number };

/** One entry per person, labelled with their most common spelling. */
export const SPEAKER_OPTIONS: SpeakerOption[] = (() => {
  const byKey = new Map<string, { names: Map<string, number>; count: number }>();
  for (const t of TALKS) {
    const key = speakerKey(t.speaker);
    const entry = byKey.get(key) ?? { names: new Map(), count: 0 };
    entry.count += 1;
    entry.names.set(t.speaker, (entry.names.get(t.speaker) ?? 0) + 1);
    byKey.set(key, entry);
  }
  return Array.from(byKey, ([key, { names, count }]) => ({
    key,
    name: Array.from(names).sort((a, b) => b[1] - a[1])[0][0],
    count,
  })).sort((a, b) => a.name.localeCompare(b.name));
})();

const SPEAKER_KEY_BY_TALK_ID = new Map(TALKS.map((t) => [t.id, speakerKey(t.speaker)]));

// ─── Matching ────────────────────────────────────────────────────────────────

export type ScopeContext = {
  /** Talk ids to exclude when scope.unstudiedOnly is on. */
  studiedIds: ReadonlySet<string>;
  /** Talk ids to restrict to when scope.savedOnly is on. */
  savedIds: ReadonlySet<string>;
};

export function talksInScope(scope: DrawScope, ctx: ScopeContext): Talk[] {
  const months = new Set(scope.months);
  const categories = new Set(scope.categories);
  const speakers = new Set(scope.speakers);
  return TALKS.filter((t) => {
    if (scope.year !== 'ALL' && t.year !== scope.year) return false;
    if (!months.has(t.month as 4 | 10)) return false;
    if (!categories.has(t.category)) return false;
    if (speakers.size > 0 && !speakers.has(SPEAKER_KEY_BY_TALK_ID.get(t.id)!)) return false;
    if (scope.unstudiedOnly && ctx.studiedIds.has(t.id)) return false;
    if (scope.savedOnly && !ctx.savedIds.has(t.id)) return false;
    return true;
  });
}

// ─── URL params ──────────────────────────────────────────────────────────────
//
// /draw?year=2015&conf=april&sessions=SATURDAY_MORNING,PRIESTHOOD&speakers=russell m nelson&saved=1
//
// Only non-default parts appear. `unstudied` is written only when it differs
// from the sign-in default (on when signed in, off for guests), so a shared
// link doesn't pin someone else's default.

export type DrawScopeParams = {
  year?: string;
  conf?: string;
  sessions?: string;
  speakers?: string;
  unstudied?: string;
  saved?: string;
};

export const DRAW_PARAM_KEYS = ['year', 'conf', 'sessions', 'speakers', 'unstudied', 'saved'] as const;

const CONF_TO_MONTH: Record<string, 4 | 10> = { april: 4, october: 10 };

/** Values are `undefined` (not omitted) so setParams can clear stale keys. */
export function scopeToParams(scope: DrawScope, signedIn: boolean): DrawScopeParams {
  const allSessions = scope.categories.length === ALL_CATEGORIES.length;
  return {
    year: scope.year === 'ALL' ? undefined : String(scope.year),
    conf: scope.months.length === 2 ? undefined : scope.months[0] === 4 ? 'april' : 'october',
    sessions: allSessions ? undefined : scope.categories.join(','),
    speakers: scope.speakers.length === 0 ? undefined : scope.speakers.join(','),
    unstudied: scope.unstudiedOnly === signedIn ? undefined : scope.unstudiedOnly ? '1' : '0',
    saved: scope.savedOnly ? '1' : undefined,
  };
}

/**
 * Reads scope params from a URL. Returns null when the URL carries none (so
 * the caller keeps the remembered scope). Anything invalid is ignored, so a
 * hand-edited or outdated link degrades to "everything" for that control.
 */
export function paramsToScope(params: DrawScopeParams): Partial<DrawScope> | null {
  if (!DRAW_PARAM_KEYS.some((k) => params[k] !== undefined)) return null;
  const scope: Partial<DrawScope> = {};
  const year = Number(params.year);
  if (ALL_YEARS.includes(year)) scope.year = year;
  const month = params.conf ? CONF_TO_MONTH[params.conf.toLowerCase()] : undefined;
  if (month) scope.months = [month];
  const categories = (params.sessions ?? '')
    .split(',')
    .filter((c): c is SessionCategory => (ALL_CATEGORIES as string[]).includes(c));
  if (categories.length > 0) scope.categories = categories;
  const speakers = (params.speakers ?? '').split(',').filter((k) => SPEAKER_KEY_BY_TALK_ID_VALUES.has(k));
  if (speakers.length > 0) scope.speakers = speakers;
  if (params.unstudied === '1') scope.unstudiedOnly = true;
  if (params.unstudied === '0') scope.unstudiedOnly = false;
  if (params.saved === '1') scope.savedOnly = true;
  return scope;
}

const SPEAKER_KEY_BY_TALK_ID_VALUES = new Set(SPEAKER_OPTIONS.map((s) => s.key));
