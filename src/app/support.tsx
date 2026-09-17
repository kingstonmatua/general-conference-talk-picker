import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@/components/ui/icon';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';

const CONTACT_EMAIL = 'kingstonmatua9@gmail.com';

/**
 * Sibling of privacy.tsx, same reasoning — needs to be reachable outside
 * the tab bar. Exists specifically so gctalkpicker.app/support is a real
 * URL: Apple requires a support URL for App Store submission (separate
 * field from the privacy policy URL).
 */
export default function SupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
            <Ionicons name="chevron-back" size={18} color={Palette.secondaryInk} />
            <ThemedText type="control" themeColor="textSecondary">
              Back
            </ThemedText>
          </Pressable>

          <ThemedText type="display">Support</ThemedText>

          <ThemedText type="body" style={styles.paragraph}>
            Questions, feedback, or something not working right? Reach out and we'll help.
          </ThemedText>

          <Pressable onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
            <ThemedText type="body" style={styles.link}>
              {CONTACT_EMAIL}
            </ThemedText>
          </Pressable>

          <ThemedText type="section" style={styles.heading}>
            Common questions
          </ThemedText>

          <ThemedText type="control" style={styles.question}>
            How do I delete my account?
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            Go to Account → Danger zone → Delete account. This permanently removes your studied
            talks, favorites, streak history, and profile picture, and can't be undone.
          </ThemedText>

          <ThemedText type="control" style={styles.question}>
            Do I need an account to use the app?
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            No — you can browse and draw talks without signing in. An account is only needed to
            save favorites, mark talks as studied, and track your study streak across devices.
          </ThemedText>

          <ThemedText type="control" style={styles.question}>
            Where does the talk content come from?
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            Every talk links out to its original page on churchofjesuschrist.org — the app itself
            only stores metadata (title, speaker, date, session) to help you find and track talks.
          </ThemedText>
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
    paddingBottom: Spacing.xxxl,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.xs,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  heading: {
    marginTop: Spacing.lg,
  },
  question: {
    marginTop: Spacing.lg,
    color: Palette.purpleInk,
  },
  paragraph: {
    marginTop: Spacing.xs,
  },
  link: {
    color: Palette.conferencePurple,
    marginTop: Spacing.xs,
  },
});
