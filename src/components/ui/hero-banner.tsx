import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { BrandedHeaderRow } from './branded-header';

import { Palette, Spacing } from '@/constants/theme';

/**
 * Photo hero, per the mobile mockups' Home treatment. Runs edge to edge
 * (full-bleed, no side margins, no rounded corners) and fades to the
 * canvas color at top and bottom — a left/right fade doesn't make sense
 * in full-bleed mode, since there's no surrounding cream to blend into,
 * it would just show as unwanted stripes over the photo. The headline
 * sits near the top (not the bottom, which is where the daily-moment
 * card now overlaps) — the top fade is generous so dark ink text has a
 * solid light patch behind it for contrast, not just a photo underneath.
 *
 * No backdrop behind the headline/subhead — a box, a whole-hero wash, a
 * real native blur, and a stacked-layer fake blur were all tried and
 * abandoned. Just the gradient fade above, plus HeroTextGlow (a soft
 * halo on the text itself, see below) for contrast.
 */
export function HeroBanner({ source, children }: { source: number; children: ReactNode }) {
  return (
    <View style={styles.container}>
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={[Palette.canvas, 'transparent', 'transparent', Palette.canvas]}
        locations={[0, 0.4, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BrandedHeaderRow />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

/**
 * Spread onto a hero headline/subhead's own style — a soft light halo
 * hugging the glyphs themselves, not a box or a photo-wide wash (both
 * tried and rejected). Reads against light and dark parts of the photo
 * alike since it's a light glow, not a shadow. Zero offset + radius
 * produces an even halo in every direction rather than a directional
 * drop shadow.
 */
export const HeroTextGlow = {
  textShadow: '0px 0px 6px rgba(247, 244, 239, 0.95)',
} as const;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // A fixed height, not an aspect ratio off the source photo — the
    // aspect-ratio math made native heroes so short (~98px on a phone)
    // that the new branded-header row pushed the headline/subhead clean
    // out of the box, clipped invisibly by overflow:hidden. 380 matches
    // what the desktop composition already uses, and reads fine at
    // native's much narrower width too.
    height: 380,
    backgroundColor: Palette.canvas,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
});
