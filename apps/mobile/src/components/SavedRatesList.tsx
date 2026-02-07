import { formatRate } from "@bcv-rates/domain";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CustomRate } from "../hooks/useCustomRates";
import { type ThemeColors, useTheme } from "../theme";

interface SavedRatesListProps {
  items: CustomRate[];
  isLoading: boolean;
  error: Error | null;
  activeLabel: string;
  onRateSelect: (label: string, formattedRate: string) => void;
}

export function SavedRatesList({
  items,
  isLoading,
  error,
  activeLabel,
  onRateSelect,
}: SavedRatesListProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Guardadas</Text>
        {items.length > 0 && (
          <Text style={styles.headerCount}>{items.length}</Text>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <Text style={styles.message}>Cargando…</Text>
      ) : error ? (
        <Text style={[styles.message, { color: colors.bannerError.text }]}>
          Error cargando tasas: {error.message}
        </Text>
      ) : items.length > 0 ? (
        <View style={styles.grid}>
          {items.map((r) => {
            const n = Number(r.rate);
            const formatted = Number.isFinite(n) ? formatRate(n) : r.rate;
            const isActive = activeLabel === r.label;

            return (
              <Pressable
                key={r.id}
                onPress={() => onRateSelect(r.label, formatted)}
                style={({ pressed }) => [
                  styles.rateCard,
                  isActive && {
                    borderColor: colors.accentIndigo,
                    backgroundColor: `${colors.accentIndigo}15`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.rateLabel} numberOfLines={1}>
                  {r.label}
                </Text>
                <Text style={styles.rateValue} numberOfLines={1}>
                  1 {r.label} = {formatted} Bs
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.message}>
          Aún no tienes tasas guardadas. Abre Configuraciones para crear una.
        </Text>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 6,
      marginTop: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    headerLabel: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textMuted,
    },
    headerCount: {
      fontSize: 11,
      color: colors.textMuted,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    rateCard: {
      flexBasis: "47%",
      flexGrow: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    pressed: {
      opacity: 0.7,
    },
    rateLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    rateValue: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    message: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
