import {
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme";

interface InputProps extends Omit<TextInputProps, "style"> {
  style?: StyleProp<ViewStyle>;
}

export function Input({ style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      placeholderTextColor={colors.inputPlaceholder}
      {...props}
      style={[
        styles.input,
        {
          backgroundColor: colors.inputBackground,
          borderColor: colors.inputBorder,
          color: colors.inputText,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
});
