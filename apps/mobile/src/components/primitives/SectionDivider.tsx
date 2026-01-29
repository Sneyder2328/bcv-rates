import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";

interface SectionDividerProps {
  label?: string;
  style?: ViewStyle;
}

export function SectionDivider({ label, style }: SectionDividerProps) {
  const { colors } = useTheme();

  if (!label) {
    return (
      <View
        style={[styles.divider, { backgroundColor: colors.divider }, style]}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.line, { backgroundColor: colors.divider }]} />
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: colors.divider }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    paddingHorizontal: 12,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
