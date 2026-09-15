import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PageFoldIcon } from '@/components/ui/page-fold-icon';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

/**
 * Placeholder for a nav destination that has a real route (so the nav shell
 * actually works end to end) but no screen content built yet.
 */
export function ComingSoonScreen({ title, description }: { title: string; description: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <ThemedText type="display">{title}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {description}
          </ThemedText>
          <PageFoldIcon size={28} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.xxxl,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    gap: Spacing.sm,
  },
});
