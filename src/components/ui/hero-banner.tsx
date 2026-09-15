import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette, Radii, Spacing } from '@/constants/theme';

/**
 * Photo hero, per the mobile mockups' Home treatment (image behind the
 * headline, fading to a dark scrim for text contrast). Inset from the
 * page edges (not full-bleed) and faded to the canvas color at top and
 * bottom, so it reads as floating on the page rather than a hard-edged
 * banner. Brand board §08 itself is more cautious here — "Keep text off
 * busy imagery... avoid... dramatic dark overlays" — so the scrim is kept
 * soft rather than heavy, as a middle ground between what was asked for
 * and that caution.
 */
export function HeroBanner({ source, children }: { source: number; children: ReactNode }) {
  return (
    <View style={styles.container}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={[Palette.canvas, 'transparent', 'rgba(38,24,69,0.5)', Palette.canvas]}
        locations={[0, 0.14, 0.62, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1774 / 887,
    backgroundColor: Palette.canvas,
    borderRadius: Radii.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
});
