import { StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Palette, Radii, Spacing } from '@/constants/theme';

export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.wrapper}>
      <Icon name="browse" size={18} color={Palette.secondaryInk} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.secondaryInk}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.warmBorder,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.purpleInk,
  },
});
