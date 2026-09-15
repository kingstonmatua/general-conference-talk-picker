import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

/**
 * Full-bleed photo hero, per the mobile mockups' Home treatment (image
 * behind the headline, fading to a dark scrim on the lower-left for text
 * contrast). Brand board §08 itself is more cautious here — "Keep text
 * off busy imagery... avoid... dramatic dark overlays" — so the scrim is
 * kept light/soft rather than heavy, as a middle ground between what was
 * asked for and that caution.
 */
export function HeroBanner({ source, children }: { source: number; children: ReactNode }) {
  return (
    <View style={styles.container}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(38,24,69,0)', 'rgba(38,24,69,0.55)']}
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
    backgroundColor: Palette.warmBorder,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
});
