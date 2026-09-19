import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Palette, Spacing } from '@/constants/theme';

// One is picked at random per draw (see use-draw-random-talk.tsx) so this
// doesn't say the same line every time.
export const DRAW_REVEAL_MESSAGES = [
  'What will you learn today?',
  "Whose words are up next?",
  "Surprise — here's your talk…",
  'A message is waiting for you…',
  "Let's see what you'll discover…",
];

/**
 * Brief full-screen beat shown between tapping "Draw a Random Talk" and
 * landing on the talk detail screen — mounted once at the root by
 * DrawRevealProvider (see use-draw-random-talk.tsx) so it covers every
 * entry point (Home's CTA, the web sidebar, the native tab bar) alike.
 */
export function DrawRevealOverlay({ visible, message }: { visible: boolean; message: string }) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
      pointerEvents="auto">
      <Animated.View entering={ZoomIn.duration(450)}>
        <Icon name="draw" size={48} color={Palette.champagne} />
      </Animated.View>
      <ThemedText type="section" style={styles.label}>
        {message}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.purpleInk,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    zIndex: 2000,
    elevation: 20,
  },
  label: {
    color: Palette.canvas,
  },
});
