import type { ReactNode } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

type BannerVariant = "info" | "success" | "warning" | "error";

interface BannerProps {
  children: ReactNode;
  variant?: BannerVariant;
  style?: ViewStyle;
}

const variantColors: Record<BannerVariant, { bg: string; text: string }> = {
  info: { bg: "#dbeafe", text: "#1e40af" },
  success: { bg: "#dcfce7", text: "#166534" },
  warning: { bg: "#fef3c7", text: "#92400e" },
  error: { bg: "#fee2e2", text: "#991b1b" },
};

export function Banner({ children, variant = "info", style }: BannerProps) {
  const colors = variantColors[variant];

  return (
    <View style={[styles.banner, { backgroundColor: colors.bg }, style]}>
      {typeof children === "string" ? (
        <Text style={[styles.text, { color: colors.text }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 12,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
});
