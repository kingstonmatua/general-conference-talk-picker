import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@/components/ui/icon';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';

const LAST_UPDATED = 'September 16, 2026';
const CONTACT_EMAIL = 'kingstonmatua9@gmail.com';

/**
 * Sibling of account.tsx / talk/[id].tsx in the root Stack, same reasoning
 * — needs to be reachable outside the tab bar. Exists specifically so
 * gctalkpicker.app/privacy is a real URL: Apple requires a privacy policy
 * link for TestFlight external testing (and later App Store review), and
 * this app collects an email + study data, so "no policy" isn't an option.
 * Content only describes what the app actually does — update it if the
 * data collected ever changes (e.g. if avatar photos or new tables are
 * added).
 */
export default function PrivacyScreen() {
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

          <ThemedText type="display">Privacy Policy</ThemedText>
          <ThemedText type="metadata" themeColor="textSecondary">
            Last updated {LAST_UPDATED}
          </ThemedText>

          <ThemedText type="body" style={styles.paragraph}>
            General Conference Talk Picker ("the app") is a study tool for browsing and tracking
            General Conference talks. This page explains what information the app collects and
            how it's used.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Information we collect
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            If you create an account, we collect the email address and password you sign up
            with. Your password is handled entirely by our authentication provider, Supabase —
            we never see or store it ourselves.
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            Once signed in, the app stores the study activity you generate: which talks you've
            marked as studied or saved as a favorite, and the dates you studied them (used to
            calculate your study streak). If you add a profile picture, that image is stored on
            our behalf by Supabase.
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            You can browse and draw talks without creating an account — in that case, none of
            the above is collected, and nothing is stored beyond your device.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            How we use it
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            This information is used only to run the app's core features for you: signing you
            in, showing your saved and studied talks, and calculating your progress and study
            streak. We don't sell your data, use it for advertising, or share it with anyone
            beyond the service providers below.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Who we share it with
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            Account and study data is stored with Supabase, our backend and database provider.
            The app itself is hosted by Cloudflare, which — like most web hosts — automatically
            logs standard technical request information (such as IP address and browser type)
            for security and performance purposes.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Deleting your data
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            To delete your account and all associated data, email us at {CONTACT_EMAIL} and
            we'll remove it.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Children's privacy
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            This app is not directed at children under 13, and we do not knowingly collect
            information from children under 13.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Contact
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            Questions about this policy or your data? Email {CONTACT_EMAIL}.
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
  paragraph: {
    marginTop: Spacing.xs,
  },
});
