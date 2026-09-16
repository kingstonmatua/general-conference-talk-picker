import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';

import { Palette } from '@/constants/theme';

/**
 * Brand board §07 — "Icons: consistent 24 px grid, 1.75 px rounded stroke...
 * Pair unfamiliar icons with text." Ionicons' outline set is a 24px-grid,
 * rounded-stroke line-icon family — the closest built-in match to that spec
 * without hand-drawing a full custom set. One family, used everywhere
 * (native tab bar via NativeTabs.Trigger.VectorIcon, and every other JS-
 * rendered icon), so the "consistent grid" rule actually holds across the
 * app rather than mixing icon families per platform.
 */
export const AppIconNames = {
  home: 'home-outline',
  browse: 'search-outline',
  progress: 'stats-chart-outline',
  saved: 'bookmark-outline',
  savedFilled: 'bookmark', // brand board: "Filled bookmark only for saved"
  studied: 'checkmark-outline',
  favorite: 'star-outline',
  favoriteFilled: 'star',
  streak: 'flame-outline',
  streakFilled: 'flame',
  account: 'person-circle-outline',
  draw: 'shuffle-outline',
} as const satisfies Record<string, ComponentProps<typeof Ionicons>['name']>;

export type AppIconName = keyof typeof AppIconNames;

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 24, color = Palette.purpleInk }: Props) {
  return <Ionicons name={AppIconNames[name]} size={size} color={color} />;
}

export { Ionicons };
