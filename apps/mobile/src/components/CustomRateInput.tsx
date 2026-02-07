import { formatAmount, parseAmount } from "@bcv-rates/domain";
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { Check, Copy } from "../icons";
import { type ThemeColors, useTheme } from "../theme";

interface CustomRateInputProps {
  rateValue: string;
  amountValue: string;
  onRateChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  unitLabel?: string;
  disabled?: boolean;
}

export function CustomRateInput({
  rateValue,
  amountValue,
  onRateChange,
  onAmountChange,
  unitLabel = "★",
  disabled = false,
}: CustomRateInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [rateFocused, setRateFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [rateCopied, setRateCopied] = useState(false);
  const [amountCopied, setAmountCopied] = useState(false);

  const parsedRate = parseAmount(rateValue);
  const formattedRate =
    parsedRate !== null && parsedRate > 0 ? formatAmount(parsedRate) : null;

  const rateLabel =
    unitLabel !== "★"
      ? `Tasa ${unitLabel} (1 ${unitLabel} = X Bs)`
      : "Tasa Personalizada (1 = X Bs)";

  const amountLabel =
    unitLabel !== "★" ? `Cantidad (${unitLabel})` : "Cantidad Personalizada";

  const rateHint =
    formattedRate !== null
      ? unitLabel !== "★"
        ? `1 ${unitLabel} = ${formattedRate} Bs`
        : `1 = ${formattedRate} Bs`
      : null;

  const handleCopy = async (
    text: string,
    suffix: string,
    setCopied: (val: boolean) => void,
  ) => {
    if (!text) return;
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      Toast.show({
        type: "success",
        text1: `${text} ${suffix} copiado al portapapeles`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Toast.show({ type: "error", text1: "Error al copiar" });
    }
  };

  return (
    <View style={styles.container}>
      {/* Rate Input */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{rateLabel}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={rateValue}
            onChangeText={onRateChange}
            editable={!disabled}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={colors.inputPlaceholder}
            selectTextOnFocus
            onFocus={() => setRateFocused(true)}
            onBlur={() => setRateFocused(false)}
            style={[
              styles.input,
              {
                paddingRight: 72,
                backgroundColor: colors.inputBackground,
                borderColor: rateFocused
                  ? colors.accentViolet
                  : colors.inputBorder,
                color: colors.inputText,
              },
            ]}
          />
          <View style={styles.suffixRow}>
            <Pressable
              onPress={() => handleCopy(rateValue, "Bs.", setRateCopied)}
              disabled={!rateValue}
              hitSlop={8}
              style={({ pressed }) => ({
                opacity: !rateValue ? 0.3 : pressed ? 0.5 : 1,
              })}
            >
              {rateCopied ? (
                <Check size={14} color={colors.accentEmerald} />
              ) : (
                <Copy size={14} color={colors.textMuted} />
              )}
            </Pressable>
            <Text
              style={[
                styles.symbol,
                {
                  color: rateFocused ? colors.accentViolet : colors.textMuted,
                },
              ]}
            >
              Bs.
            </Text>
          </View>
        </View>
      </View>

      {/* Amount Input */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{amountLabel}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={amountValue}
            onChangeText={onAmountChange}
            editable={!disabled}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={colors.inputPlaceholder}
            selectTextOnFocus
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            style={[
              styles.input,
              {
                paddingRight: 72,
                backgroundColor: colors.inputBackground,
                borderColor: amountFocused
                  ? colors.accentViolet
                  : colors.inputBorder,
                color: colors.inputText,
              },
            ]}
          />
          <View style={styles.suffixRow}>
            <Pressable
              onPress={() => handleCopy(amountValue, "", setAmountCopied)}
              disabled={!amountValue}
              hitSlop={8}
              style={({ pressed }) => ({
                opacity: !amountValue ? 0.3 : pressed ? 0.5 : 1,
              })}
            >
              {amountCopied ? (
                <Check size={14} color={colors.accentEmerald} />
              ) : (
                <Copy size={14} color={colors.textMuted} />
              )}
            </Pressable>
            <Text
              style={[
                styles.symbol,
                {
                  color: amountFocused ? colors.accentViolet : colors.textMuted,
                },
              ]}
            >
              {unitLabel}
            </Text>
          </View>
        </View>
        {rateHint && (
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>{rateHint}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    fieldGroup: {
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
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      fontSize: 16,
      fontVariant: ["tabular-nums"],
    },
    suffixRow: {
      position: "absolute",
      right: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    symbol: {
      fontSize: 15,
      fontWeight: "500",
    },
    hintRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: 4,
    },
    hintText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textMuted,
    },
  });
