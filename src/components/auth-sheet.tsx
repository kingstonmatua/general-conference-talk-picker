import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordField } from '@/components/ui/password-field';
import { useAuth } from '@/hooks/use-auth';
import { Palette, Radii, Spacing } from '@/constants/theme';

/**
 * Minimal email/password sign-in sheet. Shown whenever an action needs an
 * authenticated user (marking studied, favoriting) while signed out — see
 * useAuth().promptSignIn(). Same Supabase Auth backend as V1, so an existing
 * V1 account signs in here too.
 */
export function AuthSheet() {
  const { promptVisible, dismissPrompt, signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setNotice(null);
    setMode('signin');
  };

  const switchMode = (next: 'signin' | 'signup' | 'forgot') => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleClose = () => {
    reset();
    dismissPrompt();
  };

  const handleSubmit = async () => {
    setError(null);
    setNotice(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError("Passwords don't match. Please re-enter them.");
      return;
    }

    setSubmitting(true);
    const result =
      mode === 'forgot'
        ? await requestPasswordReset(email.trim())
        : mode === 'signin'
          ? await signIn(email, password)
          : await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === 'forgot') {
      switchMode('signin');
      setNotice('If an account exists for that email, a reset link is on its way. Open it, choose a new password, then sign in here.');
      return;
    }
    if (mode === 'signup') {
      switchMode('signin');
      setNotice('Check your email to confirm your account, then sign in.');
      return;
    }
    reset();
    dismissPrompt();
  };

  return (
    <Modal visible={promptVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <ThemedText type="section">
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {mode === 'signin'
              ? 'Sign in to track studied talks, favorites, and your streak.'
              : mode === 'signup'
                ? 'Create an account to start tracking your study progress.'
                : "Enter your account email and we'll send you a link to choose a new password."}
          </ThemedText>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={Palette.secondaryInk}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {mode !== 'forgot' && (
            <PasswordField value={password} onChangeText={setPassword} placeholder="Password" />
          )}
          {mode === 'signup' && (
            <PasswordField
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
            />
          )}

          {mode === 'signin' && (
            <Pressable onPress={() => switchMode('forgot')} hitSlop={8} style={styles.forgotLink}>
              <ThemedText type="metadata" style={styles.forgotText}>
                Forgot password?
              </ThemedText>
            </Pressable>
          )}

          {notice && (
            <ThemedText type="metadata" themeColor="textSecondary">
              {notice}
            </ThemedText>
          )}
          {error && (
            <ThemedText type="metadata" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Button
            label={
              submitting
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Send reset link'
            }
            variant="primary"
            disabled={submitting || !email || (mode !== 'forgot' && !password) || (mode === 'signup' && !confirmPassword)}
            onPress={handleSubmit}
            style={styles.fullWidthButton}
          />

          <Pressable onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} hitSlop={8}>
            <ThemedText type="control" style={styles.switchModeLink}>
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : mode === 'signup'
                  ? 'Already have an account? Sign in'
                  : 'Back to sign in'}
            </ThemedText>
          </Pressable>

          <Pressable onPress={handleClose} hitSlop={8}>
            <ThemedText type="metadata" themeColor="textSecondary" style={styles.cancelLink}>
              Cancel
            </ThemedText>
          </Pressable>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 24, 69, 0.4)',
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
  input: {
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 15,
    color: Palette.purpleInk,
  },
  error: {
    color: Palette.terracotta,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: Palette.conferencePurple,
  },
  fullWidthButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  switchModeLink: {
    textAlign: 'center',
    color: Palette.conferencePurple,
    marginTop: Spacing.xs,
  },
  cancelLink: {
    textAlign: 'center',
  },
});
