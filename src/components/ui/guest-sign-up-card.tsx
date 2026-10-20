import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

/**
 * Inline sign-up prompt for guests (SOCIAL_PLAN.md decision 8): always
 * visible, never a blocking pop-up. Opens the auth sheet on "Create
 * account", with a quieter link for people who already have one.
 * `primary` is for screens where signing up is the main action; elsewhere
 * the button stays secondary so each view keeps one primary action.
 */
export function GuestSignUpCard({
  title,
  body,
  primary = false,
}: {
  title?: string;
  body: string;
  primary?: boolean;
}) {
  const { promptSignUp, promptSignIn } = useAuth();

  return (
    <Card style={styles.inner}>
      {title && <ThemedText type="section">{title}</ThemedText>}
      <ThemedText type="body" themeColor="textSecondary">
        {body}
      </ThemedText>
      <View style={styles.actions}>
        <Button label="Create a free account" variant={primary ? 'primary' : 'secondary'} onPress={promptSignUp} />
        <Pressable onPress={promptSignIn} hitSlop={8} accessibilityRole="button">
          <ThemedText type="metadata" style={styles.link}>
            Already have an account? Sign in
          </ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  inner: {
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  actions: {
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  link: {
    color: Palette.conferencePurple,
  },
});
