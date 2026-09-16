import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Palette, Radii, Spacing } from '@/constants/theme';

/**
 * Minimal email/password sign-in sheet. Shown whenever an action needs an
 * authenticated user (marking studied, favoriting) while signed out — see
 * useAuth().promptSignIn(). Same Supabase Auth backend as V1, so an existing
 * V1 account signs in here too.
 */
export function AuthSheet() {
  const { promptVisible, dismissPrompt, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setMode('signin');
  };

  const handleClose = () => {
    reset();
    dismissPrompt();
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === 'signup') {
      setError('Check your email to confirm your account, then sign in.');
      setMode('signin');
      return;
    }
    reset();
    dismissPrompt();
  };

  return (
    <Modal visible={promptVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <ThemedText type="section">{mode === 'signin' ? 'Sign in' : 'Create account'}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {mode === 'signin'
              ? 'Sign in to track studied talks, favorites, and your streak.'
              : 'Create an account to start tracking your study progress.'}
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
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={Palette.secondaryInk}
            secureTextEntry
            style={styles.input}
          />

          {error && (
            <ThemedText type="metadata" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Button
            label={submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            variant="primary"
            disabled={submitting || !email || !password}
            onPress={handleSubmit}
            style={styles.fullWidthButton}
          />

          <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} hitSlop={8}>
            <ThemedText type="control" style={styles.switchModeLink}>
              {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
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
