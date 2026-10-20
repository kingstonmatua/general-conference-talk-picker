import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@/components/ui/icon';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';

const LAST_UPDATED = 'October 20, 2026';
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
            we never see or store it ourselves. Your email address is also used to send you
            account emails, such as sign-up confirmation and password resets, through Supabase.
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            Once signed in, the app stores the study activity you generate: which talks you've
            marked as studied or saved as a favorite, and the dates you studied them (used to
            calculate your study streak). If you add a profile picture, that image is stored on
            our behalf by Supabase.
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            If you use the Social tab, you choose a username. Other signed-in users can find
            you by searching for it. We also store your friend requests and friendships, and
            the invite link you can share.
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
            in, showing your saved and studied talks, calculating your progress and study streak,
            and showing you and your friends on the leaderboard. We don't sell your data, use it for advertising, or share it with anyone
            beyond the service providers below.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            What other people can see
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            Anyone signed in can see your username and profile picture in search results, and
            anyone you send your invite link to sees them on the invite page. Only
            people you've accepted as friends can see your study stats on the leaderboard: talks
            studied, your current and longest streaks. Your email address is never shown to
            anyone. Removing a friend stops them seeing your stats.
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
            Cookies and device storage
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            The app uses your browser's local storage (or your device's storage in the iPhone
            app) to keep you signed in and to remember the filters you chose on the Draw page.
            That's all it stores there. We don't use advertising or tracking cookies.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Data retention
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            We keep your data until you delete your account. After that, deleted data may remain
            in our provider's backups for a short period before being permanently purged.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Deleting your data
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            You can permanently delete your account and all associated data, including your
            username and friendships, at any time from
            Account → Danger zone → Delete account, right inside the app.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Children's privacy
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            This app is not directed at children under 13, and we do not knowingly collect
            information from children under 13. If you believe a child under 13 has created an
            account, contact us and we'll delete it.
          </ThemedText>

          <ThemedText type="section" style={styles.heading}>
            Changes to this policy
          </ThemedText>
          <ThemedText type="body" style={styles.paragraph}>
            If this policy changes, we'll update the date at the top of this page.
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
