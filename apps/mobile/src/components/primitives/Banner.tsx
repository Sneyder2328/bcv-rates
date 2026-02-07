import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";

type BannerVariant = "info" | "success" | "warning" | "error";

interface BannerProps {
  children: ReactNode;
  variant?: BannerVariant;
  style?: StyleProp<ViewStyle>;
}

export function Banner({ children, variant = "info", style }: BannerProps) {
  const { colors } = useTheme();

  const variantColors: Record<BannerVariant, { bg: string; text: string }> = {
    info: colors.bannerInfo,
    success: colors.bannerSuccess,
    warning: colors.bannerWarning,
    error: colors.bannerError,
  };

  const { bg } = variantColors[variant];

  return (
    <View style={[styles.banner, { backgroundColor: bg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
