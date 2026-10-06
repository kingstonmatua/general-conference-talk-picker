import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Palette, Radii, Spacing } from '@/constants/theme';
import { useSocial } from '@/hooks/use-social';

// Same rule as set_username() in supabase/social.sql, checked here too so
// the Save button can explain the problem before a round trip.
const USERNAME_PATTERN = /^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$/;

/**
 * The username box, shared by first-time setup on the Social tab and the
 * change form on the Account screen. Calls onSaved after the server accepts
 * it; the provider has already reloaded the profile by then.
 */
export function UsernameForm({
  initialValue = '',
  saveLabel = 'Save username',
  onSaved,
  onCancel,
}: {
  initialValue?: string;
  saveLabel?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { setUsername } = useSocial();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = value.trim().replace(/^@/, '');
  const unchanged = !!initialValue && username === initialValue;
  const valid = USERNAME_PATTERN.test(username) && !username.includes('..');
  const hint =
    username.length === 0
      ? '3–20 characters: lowercase letters, numbers, _ and .'
      : username.length < 3
        ? 'At least 3 characters.'
        : username.length > 20
          ? 'No more than 20 characters.'
          : !valid
            ? 'Only lowercase letters, numbers, _ and . (no ".." and no "." at the start or end).'
            : unchanged
              ? 'That’s your current username.'
              : `You'll be @${username}`;

  const save = async () => {
    if (!valid || unchanged || saving) return;
    setSaving(true);
    setError(null);
    const result = await setUsername(username);
    setSaving(false);
    if (result.error) setError(result.error);
    else onSaved?.();
  };

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <ThemedText type="control" themeColor="textSecondary">
          @
        </ThemedText>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text.toLowerCase());
            setError(null);
          }}
          onSubmitEditing={save}
          placeholder="username"
          placeholderTextColor={Palette.secondaryInk}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          maxLength={21}
          returnKeyType="done"
          style={styles.input}
        />
      </View>

      <ThemedText type="metadata" style={error ? styles.error : { color: Palette.secondaryInk }}>
        {error ?? hint}
      </ThemedText>

      <View style={styles.buttons}>
        <Button
          label={saving ? 'Saving…' : saveLabel}
          variant="primary"
          disabled={!valid || unchanged || saving}
          onPress={save}
        />
        {onCancel && <Button label="Cancel" variant="secondary" disabled={saving} onPress={onCancel} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    alignSelf: 'stretch',
    gap: Spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    borderRadius: Radii.button,
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.purpleInk,
  },
  error: {
    color: Palette.terracotta,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
});
