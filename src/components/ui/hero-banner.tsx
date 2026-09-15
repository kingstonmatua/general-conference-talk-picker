import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

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
 */
export function HeroBanner({ source, children }: { source: number; children: ReactNode }) {
  return (
    <View style={styles.container}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={[Palette.canvas, 'transparent', 'transparent', Palette.canvas]}
        locations={[0, 0.4, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const IMAGE_ASPECT_RATIO = 1774 / 887;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // Half the source image's natural height for a given width.
    aspectRatio: IMAGE_ASPECT_RATIO * 2,
    backgroundColor: Palette.canvas,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
});
