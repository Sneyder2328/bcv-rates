import type { ReactNode } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";

type BannerVariant = "info" | "success" | "warning" | "error";

interface BannerProps {
  children: ReactNode;
  variant?: BannerVariant;
  style?: ViewStyle;
}

export function Banner({ children, variant = "info", style }: BannerProps) {
  const { colors } = useTheme();

  const variantColors: Record<BannerVariant, { bg: string; text: string }> = {
    info: colors.bannerInfo,
    success: colors.bannerSuccess,
    warning: colors.bannerWarning,
    error: colors.bannerError,
  };

  const bannerColors = variantColors[variant];

  return (
    <View style={[styles.banner, { backgroundColor: bannerColors.bg }, style]}>
      {typeof children === "string" ? (
        <Text style={[styles.text, { color: bannerColors.text }]}>
          {children}
        </Text>
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
