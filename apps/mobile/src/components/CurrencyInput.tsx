import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { type ThemeColors, useTheme } from "../theme";

interface CurrencyInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  symbol: string;
  exchangeRate?: string;
  large?: boolean;
  style?: ViewStyle;
}

export function CurrencyInput({
  label,
  value,
  onChangeText,
  disabled = false,
  symbol,
  exchangeRate,
  large = false,
  style,
}: CurrencyInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            large && styles.inputLarge,
            disabled && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          keyboardType="decimal-pad"
          placeholder="0,00"
          placeholderTextColor={colors.inputPlaceholder}
          selectTextOnFocus
        />
        <Text
          style={[styles.symbol, disabled && styles.symbolDisabled]}
          pointerEvents="none"
        >
          {symbol}
        </Text>
      </View>
      {exchangeRate ? (
        <Text style={styles.exchangeRate}>{exchangeRate}</Text>
      ) : null}
    </View>
  );
}

const getThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      marginLeft: 2,
    },
    inputContainer: {
      position: "relative",
      justifyContent: "center",
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
      paddingLeft: 16,
      paddingRight: 48,
      fontSize: 16,
      color: colors.inputText,
    },
    inputLarge: {
      paddingVertical: 18,
      fontSize: 20,
    },
    inputDisabled: {
      opacity: 0.5,
    },
    symbol: {
      position: "absolute",
      right: 16,
      fontSize: 14,
      fontWeight: "500",
      color: colors.textMuted,
    },
    symbolDisabled: {
      opacity: 0.5,
    },
    exchangeRate: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "right",
      marginTop: 4,
      marginRight: 2,
    },
  });
