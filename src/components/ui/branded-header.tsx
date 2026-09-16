import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ThemedText } from '../themed-text';

import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

/**
 * Native-only header row — brand mark (icon + wordmark) on the left,
 * account entry point on the right, on the same line. Floats directly
 * over the hero photo, above the headline's own text backdrop. Web keeps
 * its own sidebar logo/account footer, so this renders nothing there.
 */
export function BrandedHeaderRow() {
  const { user, avatarUrl, promptSignIn } = useAuth();
  const router = useRouter();

  if (Platform.OS === 'web') return null;

  const onPressAccount = () => {
    if (!user) {
      promptSignIn();
      return;
    }
    // A real account screen (src/app/account.tsx), not a bare native
    // Alert.alert sign-out popup like before.
    router.push('/account');
  };

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <Image
          source={require('@/assets/images/brand/main-icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <ThemedText type="eyebrow" style={styles.wordmark}>
          General Conference{'\n'}Talk Picker
        </ThemedText>
      </View>
      <Pressable onPress={onPressAccount} hitSlop={8} style={styles.avatarButton}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <Icon name="account" size={36} color={Palette.purpleInk} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  logo: {
    width: 28,
    height: 28,
  },
  wordmark: {
    color: Palette.purpleInk,
    lineHeight: 15,
    fontSize: 11,
  },
  avatarButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
});
