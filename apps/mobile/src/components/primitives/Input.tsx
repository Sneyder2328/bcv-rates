import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme";

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  error?: boolean;
}

export function Input({
  containerStyle,
  inputStyle,
  error = false,
  ...props
}: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.borderError : colors.inputBorder,
            color: colors.inputText,
          },
          inputStyle,
        ]}
        placeholderTextColor={colors.inputPlaceholder}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
