import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/theme';

/**
 * Brand board §07 — the signature motif: "Open-book / V motif: a shallow,
 * symmetric page fold. Use at 16-48 px with a 1.5-2 px stroke; one
 * signature moment per module. It is decoration, not a replacement logo."
 *
 * No off-the-shelf icon in Ionicons (or any standard set) is this specific
 * shape, so it's hand-drawn as a small SVG: two shallow strokes meeting at
 * a soft center dip, evoking two book pages meeting at the spine. This is
 * a first pass at the shape — worth comparing directly against the
 * mockups' gold chevron marks once you're looking at it live.
 */
export function PageFoldIcon({
  size = 24,
  color = Palette.goldInk,
  strokeWidth = 1.75,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size * 0.42} viewBox="0 0 48 20" fill="none">
      <Path
        d="M4 4 C 12 4, 18 16, 24 16 C 30 16, 36 4, 44 4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
