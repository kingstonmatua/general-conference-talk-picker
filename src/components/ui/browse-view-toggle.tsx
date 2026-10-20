import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { Spacing } from '@/constants/theme';

/**
 * "All | Saved" switch at the top of Browse and Saved (SOCIAL_PLAN.md
 * decision 7: Saved folds into Browse so the native bar has room for
 * Social). The two views stay separate routes, so it navigates rather than
 * swapping local state: the web sidebar still lists Saved as its own item
 * and highlights the right one, and on native the hidden `saved` tab keeps
 * Browse lit while it's showing (see app-tabs.tsx).
 */
export function BrowseViewToggle({ current }: { current: 'all' | 'saved' }) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pill label="All talks" selected={current === 'all'} onPress={() => router.navigate('/browse')} />
      <Pill label="Saved" selected={current === 'saved'} onPress={() => router.navigate('/saved')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
