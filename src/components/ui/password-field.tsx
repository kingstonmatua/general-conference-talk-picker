import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Ionicons } from '@/components/ui/icon';
import { Palette, Radii, Spacing } from '@/constants/theme';

type Props = Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'onSubmitEditing' | 'autoComplete'>;

/**
 * Password input with a show/hide eye toggle. Each field keeps its own
 * reveal state, so "Password" and "Confirm password" can be shown independently.
 */
export function PasswordField(props: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        placeholderTextColor={Palette.secondaryInk}
        secureTextEntry={!revealed}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <Pressable
        onPress={() => setRevealed((r) => !r)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
        style={styles.eye}>
        <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={Palette.secondaryInk} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    borderRadius: Radii.button,
    paddingLeft: Spacing.md,
    paddingRight: 44,
    height: 48,
    fontSize: 15,
    color: Palette.purpleInk,
  },
  eye: {
    position: 'absolute',
    right: Spacing.md,
  },
});
