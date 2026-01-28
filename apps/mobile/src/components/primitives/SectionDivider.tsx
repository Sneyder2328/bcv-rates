import { StyleSheet, Text, View, type ViewStyle } from "react-native";

interface SectionDividerProps {
  label?: string;
  style?: ViewStyle;
}

export function SectionDivider({ label, style }: SectionDividerProps) {
  if (!label) {
    return <View style={[styles.divider, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
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
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  label: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
