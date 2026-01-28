import { StyleSheet, Text, type TextStyle } from "react-native";
import { useTheme } from "../../theme";

interface LabelProps {
  children: string;
  style?: TextStyle;
}

export function Label({ children, style }: LabelProps) {
  const { colors } = useTheme();

  return (
    <Text style={[styles.label, { color: colors.textSecondary }, style]}>
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
