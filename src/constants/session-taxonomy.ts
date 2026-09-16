/**
 * Maps the 21 raw `session` strings found in the real talks dataset
 * (`app/General Conference Database FINAL - Sheet1.csv`, sibling V1 checkout)
 * to the 10 normalized `SessionCategory` values used throughout the UI.
 *
 * Locked mapping decisions (see project memory / SESSION_HANDOFF.md):
 * - RELIEF_SOCIETY absorbs "General Women's Session/Meeting" AND
 *   "General Relief Society Meeting" — not a separate WOMEN category.
 * - YOUNG_WOMEN has zero matches in the real data; kept in the type for
 *   future-proofing but nothing maps to it here.
 * - There is no GENERAL_SESSION catch-all. Historical weekday sessions
 *   (Tuesday/Thursday/Friday — conference used to run those days in
 *   earlier decades) fall into OTHER_HISTORICAL.
 */

import type { SessionCategory } from '@/constants/theme';

export const RAW_SESSION_TO_CATEGORY: Record<string, SessionCategory> = {
  'Friday Afternoon Session': 'OTHER_HISTORICAL',
  'Friday Morning Session': 'OTHER_HISTORICAL',
  'General Priesthood Meeting': 'PRIESTHOOD',
  'General Priesthood Session': 'PRIESTHOOD',
  'General Relief Society Meeting': 'RELIEF_SOCIETY',
  'General Welfare Session': 'WELFARE',
  'General Women’s Meeting': 'RELIEF_SOCIETY',
  'General Women’s Session': 'RELIEF_SOCIETY',
  'Priesthood Session': 'PRIESTHOOD',
  'Saturday Afternoon Session': 'SATURDAY_AFTERNOON',
  'Saturday Evening Session': 'SATURDAY_EVENING',
  'Saturday Morning': 'SATURDAY_MORNING',
  'Saturday Morning Session': 'SATURDAY_MORNING',
  'Sunday Afternoon Session': 'SUNDAY_AFTERNOON',
  'Sunday Morning Session': 'SUNDAY_MORNING',
  'Thursday Afternoon Session': 'OTHER_HISTORICAL',
  'Thursday Morning Session': 'OTHER_HISTORICAL',
  'Tuesday Afternoon Session': 'OTHER_HISTORICAL',
  'Tuesday Morning Session': 'OTHER_HISTORICAL',
  'Welfare Services Session': 'WELFARE',
  'Welfare Session': 'WELFARE',
};

export function mapRawSessionToCategory(raw: string): SessionCategory {
  const category = RAW_SESSION_TO_CATEGORY[raw];
  if (!category) {
    throw new Error(
      `Unmapped raw session value: "${raw}". Add it to RAW_SESSION_TO_CATEGORY in session-taxonomy.ts.`,
    );
  }
  return category;
}
