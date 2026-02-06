import { formatAmount, parseAmount } from "@bcv-rates/domain";
import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { type ThemeColors, useTheme } from "../theme";

interface CustomRateInputProps {
  rateValue: string;
  amountValue: string;
  onRateChange: (text: string) => void;
  onAmountChange: (text: string) => void;
  unitLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function CustomRateInput({
  rateValue,
  amountValue,
  onRateChange,
  onAmountChange,
  unitLabel = "★",
  disabled = false,
  style,
}: CustomRateInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const parsedRate = parseAmount(rateValue);
  const formattedRate =
    parsedRate !== null && parsedRate > 0 ? formatAmount(parsedRate) : null;

  const rateLabel =
    unitLabel !== "★"
      ? `Tasa ${unitLabel} (1 ${unitLabel} = X Bs)`
      : "Tasa Personalizada (1 = X Bs)";

  const amountLabel =
    unitLabel !== "★" ? `Cantidad (${unitLabel})` : "Cantidad Personalizada";

  return (
    <View style={style}>
      {/* Rate input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{rateLabel}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            value={rateValue}
            onChangeText={onRateChange}
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
            Bs.
          </Text>
        </View>
      </View>

      {/* Amount input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{amountLabel}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            value={amountValue}
            onChangeText={onAmountChange}
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
            {unitLabel}
          </Text>
        </View>
        {formattedRate ? (
          <Text style={styles.exchangeRate}>
            {unitLabel !== "★"
              ? `1 ${unitLabel} = ${formattedRate} Bs`
              : `1 = ${formattedRate} Bs`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const getThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fieldContainer: {
      marginBottom: 12,
    },
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
