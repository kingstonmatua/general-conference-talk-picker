import type { SessionCategory } from '@/constants/theme';

import talksJson from './talks.json';

/**
 * The real General Conference talks dataset, generated from
 * `app/General Conference Database FINAL - Sheet1.csv` (sibling V1 checkout)
 * via `scripts/generate-talks-data.js`. Regenerate after the source CSV
 * changes — do not hand-edit `talks.json`.
 */
export type Talk = {
  id: string;
  talkNumber: number;
  title: string;
  speaker: string;
  year: number;
  month: number;
  /** Raw session label as it appears in the source CSV. */
  session: string;
  /** Normalized session-taxonomy category (see session-taxonomy.ts). */
  category: SessionCategory;
  url: string;
};

export const TALKS: Talk[] = talksJson as Talk[];

const TALKS_BY_ID = new Map(TALKS.map((t) => [t.id, t]));

export function getTalkById(id: string): Talk | undefined {
  return TALKS_BY_ID.get(id);
}

export function getTalksByCategory(category: SessionCategory): Talk[] {
  return TALKS.filter((t) => t.category === category);
}

export function searchTalks(query: string): Talk[] {
  const q = query.trim().toLowerCase();
  if (!q) return TALKS;
  return TALKS.filter(
    (t) => t.title.toLowerCase().includes(q) || t.speaker.toLowerCase().includes(q),
  );
}

const MONTH_NAMES: Record<number, string> = { 4: 'April', 10: 'October' };

/** "Speaker Name · Month Year", matching the brand board's TalkCard meta line. */
export function formatTalkMeta(talk: Talk): string {
  const month = MONTH_NAMES[talk.month] ?? `Month ${talk.month}`;
  return `${talk.speaker} · ${month} ${talk.year}`;
}
