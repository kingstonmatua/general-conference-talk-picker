import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordField } from '@/components/ui/password-field';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

type Stage = 'checking' | 'ready' | 'invalid' | 'done';

/**
 * Landing page for the link in Supabase's password-reset email
 * (https://gctalkpicker.app/reset-password). The link carries a short-lived
 * recovery session in the URL hash; we hand it to the Supabase client, ask
 * for a new password twice, then send the person back to sign in. Web-only
 * in practice — the native app never opens this route, since the emailed
 * link always opens in a browser.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, signOut } = useAuth();
  const [stage, setStage] = useState<Stage>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setStage('invalid');
      return;
    }
    // supabase.ts sets detectSessionInUrl: false, so read the hash ourselves.
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken || params.get('type') !== 'recovery') {
      setStage('invalid');
      return;
    }
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: e }) => {
      // Drop the tokens from the address bar / history once consumed.
      window.history.replaceState(null, '', window.location.pathname);
      setStage(e ? 'invalid' : 'ready');
    });
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please re-enter them.");
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Make them sign in with the new password rather than leaving the
    // recovery session acting as a login.
    await signOut();
    setStage('done');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Card style={styles.card}>
          <ThemedText type="section">Choose a new password</ThemedText>

          {stage === 'checking' && (
            <ThemedText type="body" themeColor="textSecondary">
              Checking your reset link…
            </ThemedText>
          )}

          {stage === 'invalid' && (
            <>
              <ThemedText type="body" themeColor="textSecondary">
                This reset link is invalid or has expired. Go back to the app, tap “Forgot password?” on the sign-in
                screen, and request a new one.
              </ThemedText>
              <Button label="Back to the app" variant="secondary" onPress={() => router.replace('/')} />
            </>
          )}

          {stage === 'ready' && (
            <>
              <ThemedText type="body" themeColor="textSecondary">
                Enter your new password twice to make sure it's typed correctly.
              </ThemedText>
              <PasswordField value={password} onChangeText={setPassword} placeholder="New password" />
              <PasswordField
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
              />
              {error && (
                <ThemedText type="metadata" style={styles.error}>
                  {error}
                </ThemedText>
              )}
              <Button
                label={submitting ? 'Please wait…' : 'Save new password'}
                variant="primary"
                disabled={submitting || !password || !confirmPassword}
                onPress={handleSubmit}
              />
            </>
          )}

          {stage === 'done' && (
            <>
              <ThemedText type="body" themeColor="textSecondary">
                Your password has been updated. Sign in with your new password.
              </ThemedText>
              <Button label="Continue" variant="primary" onPress={() => router.replace('/')} />
            </>
          )}
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    gap: Spacing.sm,
    alignItems: 'stretch',
  },
  error: {
    color: Palette.terracotta,
  },
});
