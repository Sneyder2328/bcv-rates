import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, type TextStyle } from "react-native";
import { type ThemeColors, useTheme } from "../../theme";

interface LabelProps {
  children: ReactNode;
  style?: TextStyle;
}

export function Label({ children, style }: LabelProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  return <Text style={[styles.label, style]}>{children}</Text>;
}

const getThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 4,
    },
  });
