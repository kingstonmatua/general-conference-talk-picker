/**
 * Design tokens for General Conference Talk Picker V2.
 * Source of truth: Design/GPT Mock Images/talk-picker-v2-brand-board.pdf
 * and the locked session-taxonomy mapping (see project memory).
 *
 * The brand board only specifies a light, warm-paper palette — there is no
 * dark-mode spec yet, so `dark` currently mirrors `light`. app.json pins
 * userInterfaceStyle to "light" for the same reason until a dark palette
 * is designed.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ─── Brand palette (Brand board §04) ───────────────────────────────────────

export const Palette = {
  canvas: '#F7F4EF',
  surface: '#FFFEFC',
  purpleInk: '#261845',
  secondaryInk: '#6D6873',
  champagne: '#EED9A0',
  goldInk: '#765A24',
  conferencePurple: '#5B2CB5',
  sage: '#A9B8A0',
  terracotta: '#C98F78',
  dustyBlue: '#91A9BE',
  warmBorder: '#E7E0D7',
  softLavender: '#E9E3F6',
} as const;

// ─── Session-tag tints (locked session taxonomy) ───────────────────────────
// Lighter tint backgrounds specifically for session tags, layered on top of
// the base Palette accents above. Dark-on-light text pairings were not
// given as exact hex values by the brand spec ("dark blue/sage/purple/
// terracotta/brown-gold/neutral text with sufficient accessible contrast")
// — the *Text values below are derived to clear ~4.5:1 contrast against
// their paired background and can be adjusted.

export const SessionTagColors = {
  dustyBlue: { bg: '#DCE8F1', text: '#1F3A52' },
  sage: { bg: '#DFE8DD', text: '#33402E' },
  lavender: { bg: '#E9E3F6', text: Palette.purpleInk },
  terracotta: { bg: '#F2DDD5', text: '#6B3226' },
  champagne: { bg: '#F5E9C9', text: Palette.goldInk },
  warmGray: { bg: '#EEEAE4', text: '#4A443E' },
} as const;

export type SessionCategory =
  | 'SATURDAY_MORNING'
  | 'SATURDAY_AFTERNOON'
  | 'SATURDAY_EVENING'
  | 'SUNDAY_MORNING'
  | 'SUNDAY_AFTERNOON'
  | 'PRIESTHOOD'
  | 'RELIEF_SOCIETY'
  | 'YOUNG_WOMEN'
  | 'WELFARE'
  | 'OTHER_HISTORICAL';

export const SessionCategoryTag: Record<
  SessionCategory,
  { label: string; color: keyof typeof SessionTagColors }
> = {
  SATURDAY_MORNING: { label: 'Saturday Morning', color: 'dustyBlue' },
  SATURDAY_AFTERNOON: { label: 'Saturday Afternoon', color: 'sage' },
  SATURDAY_EVENING: { label: 'Saturday Evening', color: 'lavender' },
  SUNDAY_MORNING: { label: 'Sunday Morning', color: 'dustyBlue' },
  SUNDAY_AFTERNOON: { label: 'Sunday Afternoon', color: 'terracotta' },
  PRIESTHOOD: { label: 'Priesthood', color: 'sage' },
  RELIEF_SOCIETY: { label: 'Relief Society', color: 'terracotta' },
  YOUNG_WOMEN: { label: 'Young Women', color: 'terracotta' },
  WELFARE: { label: 'Welfare', color: 'champagne' },
  OTHER_HISTORICAL: { label: 'Historical', color: 'warmGray' },
};

// ─── Light/dark theme resolution (see note above re: dark mode) ───────────

export const Colors = {
  light: {
    text: Palette.purpleInk,
    textSecondary: Palette.secondaryInk,
    background: Palette.canvas,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.softLavender,
    border: Palette.warmBorder,
    tint: Palette.conferencePurple,
  },
  dark: {
    text: Palette.purpleInk,
    textSecondary: Palette.secondaryInk,
    background: Palette.canvas,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.softLavender,
    border: Palette.warmBorder,
    tint: Palette.conferencePurple,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Typography (Brand board §02 — Georgia for editorial, Arial for UI) ───
// iOS and web ship real "Georgia" and "Arial" fonts under those exact
// names. Android has neither pre-installed — it falls back to the closest
// generic family (serif ≈ Noto Serif, sans-serif ≈ Roboto). Bundling the
// literal font files would give pixel parity on Android too, but Arial in
// particular is a licensed Monotype font, so that's left as a follow-up
// rather than silently embedding it.

export const Fonts = Platform.select({
  ios: {
    serif: 'Georgia',
    sans: 'Arial',
    mono: 'ui-monospace',
  },
  web: {
    serif: 'var(--font-serif)',
    sans: 'var(--font-sans-arial)',
    mono: 'var(--font-mono)',
  },
  default: {
    serif: 'serif',
    sans: 'sans-serif',
    mono: 'monospace',
  },
})!;

// ─── Spacing scale — Brand board §03: 4 8 12 16 24 32 48 ───────────────────
// `half`/`one`/.../`six` are the original scaffold-template aliases, kept so
// the stock demo screens (index.tsx, explore.tsx, etc.) keep compiling
// unmodified. New design-system code should use the named brand-scale keys.

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  // scaffold-template aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// ─── Radii — Brand board §03: cards 12px, buttons 10px, tags fully rounded ─

export const Radii = {
  card: 12,
  button: 10,
  tag: 999,
} as const;

export const MinTouchTarget = 44;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 960;
