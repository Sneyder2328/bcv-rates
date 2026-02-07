import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { type ThemeColors, useTheme } from "../theme";

type FocusColor = "indigo" | "emerald" | "blue" | "violet";

interface CurrencyInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  disabled?: boolean;
  symbol: string;
  focusColor: FocusColor;
  exchangeRate?: string;
  inputSize?: "sm" | "lg";
  deltaPercent?: number;
}

export function CurrencyInput({
  label,
  value,
  onChangeText,
  disabled = false,
  symbol,
  focusColor,
  exchangeRate,
  inputSize = "sm",
  deltaPercent,
}: CurrencyInputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const accentColorMap: Record<FocusColor, string> = {
    indigo: colors.accentIndigo,
    emerald: colors.accentEmerald,
    blue: colors.accentBlue,
    violet: colors.accentViolet,
  };
  const accent = accentColorMap[focusColor];

  const height = inputSize === "lg" ? 56 : 48;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          keyboardType="decimal-pad"
          placeholder="0,00"
          placeholderTextColor={colors.inputPlaceholder}
          selectTextOnFocus
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              height,
              backgroundColor: colors.inputBackground,
              borderColor: isFocused ? accent : colors.inputBorder,
              color: colors.inputText,
              fontSize: inputSize === "lg" ? 20 : 16,
            },
          ]}
        />
        <Text
          style={[
            styles.symbol,
            { color: isFocused ? accent : colors.textMuted },
          ]}
        >
          {symbol}
        </Text>
      </View>

      {/* Rate hint + delta row */}
      {(exchangeRate || typeof deltaPercent === "number") && (
        <View style={styles.hintRow}>
          {exchangeRate && <Text style={styles.hintText}>{exchangeRate}</Text>}
          {typeof deltaPercent === "number" && (
            <DeltaBadge deltaPercent={deltaPercent} colors={colors} />
          )}
        </View>
      )}
    </View>
  );
}

function DeltaBadge({
  deltaPercent,
  colors,
}: {
  deltaPercent: number;
  colors: ThemeColors;
}) {
  const arrow = deltaPercent > 0 ? "▲" : deltaPercent < 0 ? "▼" : "—";
  const color =
    deltaPercent > 0
      ? colors.bannerSuccess.text
      : deltaPercent < 0
        ? colors.bannerError.text
        : colors.textMuted;

  return (
    <Text style={{ color, fontSize: 12, fontWeight: "600" }}>
      {arrow} {Math.abs(deltaPercent).toFixed(2)}%
    </Text>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 4,
    },
    label: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: colors.textMuted,
      marginLeft: 4,
    },
    inputWrapper: {
      position: "relative",
      justifyContent: "center",
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingRight: 44,
      fontVariant: ["tabular-nums"],
    },
    symbol: {
      position: "absolute",
      right: 14,
      fontSize: 15,
      fontWeight: "500",
    },
    hintRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 4,
    },
    hintText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textMuted,
    },
  });
