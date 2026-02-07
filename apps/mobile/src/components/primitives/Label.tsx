import { StyleSheet, Text, type TextProps } from "react-native";
import { useTheme } from "../../theme";

interface LabelProps extends TextProps {
  children: string;
}

export function Label({ children, style, ...props }: LabelProps) {
  const { colors } = useTheme();

  return (
    <Text style={[styles.label, { color: colors.text }, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
});
