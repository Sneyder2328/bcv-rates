import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Banner, Button, Card } from "../src/components/primitives";
import {
  formatRateDisplay,
  useExchangeRates,
} from "../src/hooks/useExchangeRates";
import { Home, Settings, WifiOff } from "../src/icons";
import { type ThemeColors, useTheme } from "../src/theme";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { rates, error, isLoading, syncingRates, statusLine, isOnline } =
    useExchangeRates();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Home size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>El Cambio</Text>
          <Text style={styles.subtitle}>BCV Rates</Text>
        </View>
        <View style={styles.headerRight}>
          <Button variant="ghost" onPress={() => router.push("/settings")}>
            <Settings size={24} color={colors.textMuted} />
          </Button>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline banner */}
        {!isOnline && (
          <Banner variant="warning" style={styles.banner}>
            <View style={styles.bannerRow}>
              <WifiOff size={16} color={colors.bannerWarning.text} />
              <Text
                style={[
                  styles.bannerText,
                  { color: colors.bannerWarning.text },
                ]}
              >
                Sin conexión a internet
                {rates ? " — mostrando datos guardados" : ""}
              </Text>
            </View>
          </Banner>
        )}

        {/* Error banner (only when online and we have an error) */}
        {isOnline && error && (
          <Banner variant="error" style={styles.banner}>
            <Text
              style={[styles.bannerText, { color: colors.bannerError.text }]}
            >
              {error}
            </Text>
          </Banner>
        )}

        {/* Rates card */}
        <Card style={styles.card}>
          <View style={styles.ratesHeader}>
            <Text style={styles.cardTitle}>Tasas de Cambio</Text>
            {syncingRates && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {isLoading && !rates ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando tasas…</Text>
            </View>
          ) : rates ? (
            <View style={styles.ratesContainer}>
              <RateRow
                label="USD"
                rate={rates.usd}
                previousRate={rates.usdPrevious}
                colors={colors}
                styles={styles}
              />
              <View style={styles.rateDivider} />
              <RateRow
                label="EUR"
                rate={rates.eur}
                previousRate={rates.eurPrevious}
                colors={colors}
                styles={styles}
              />
            </View>
          ) : (
            <Text style={styles.cardSubtitle}>{statusLine}</Text>
          )}

          {/* Status line */}
          {rates && <Text style={styles.statusLine}>{statusLine}</Text>}
        </Card>

        {/* Converter placeholder */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Convertidor</Text>
          <Text style={styles.cardSubtitle}>
            Currency converter coming in Phase 4.
          </Text>
        </Card>

        {/* Navigation buttons */}
        <View style={styles.navButtons}>
          <Button
            variant="outline"
            onPress={() => router.push("/history")}
            style={styles.navButton}
          >
            Ver Historial
          </Button>
        </View>

        {/* Auth placeholder */}
        <Button
          variant="outline"
          onPress={() => router.push("/auth")}
          style={styles.authButton}
        >
          Iniciar sesión
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

// -------------------------------------------------------------------
// Rate row component
// -------------------------------------------------------------------

function RateRow({
  label,
  rate,
  previousRate,
  colors,
  styles,
}: {
  label: string;
  rate: number;
  previousRate?: number;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
}) {
  const formatted = formatRateDisplay(rate);

  let changeIndicator: string | null = null;
  let changeColor = colors.textMuted;

  if (previousRate !== undefined && previousRate !== rate) {
    if (rate > previousRate) {
      changeIndicator = "▲";
      changeColor = colors.bannerSuccess.text;
    } else {
      changeIndicator = "▼";
      changeColor = colors.bannerError.text;
    }
  }

  return (
    <View style={styles.rateRow}>
      <Text style={styles.rateLabel}>{label}</Text>
      <View style={styles.rateValueRow}>
        <Text style={styles.rateValue}>{formatted}</Text>
        <Text style={styles.rateCurrency}> Bs.</Text>
        {changeIndicator && (
          <Text style={[styles.rateChange, { color: changeColor }]}>
            {" "}
            {changeIndicator}
          </Text>
        )}
      </View>
    </View>
  );
}

// -------------------------------------------------------------------
// Styles
// -------------------------------------------------------------------

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      width: 48,
      justifyContent: "center",
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    headerRight: {
      width: 48,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
    },
    // Banners
    banner: {
      marginBottom: 12,
    },
    bannerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    bannerText: {
      fontSize: 13,
      flexShrink: 1,
    },
    // Rates
    ratesHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    ratesContainer: {
      gap: 4,
    },
    rateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    rateLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textMuted,
    },
    rateValueRow: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    rateValue: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    rateCurrency: {
      fontSize: 14,
      color: colors.textMuted,
    },
    rateChange: {
      fontSize: 14,
      fontWeight: "600",
    },
    rateDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    statusLine: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 8,
      textAlign: "center",
    },
    loadingContainer: {
      paddingVertical: 24,
      alignItems: "center",
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    navButtons: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    navButton: {
      flex: 1,
    },
    authButton: {
      marginTop: 4,
    },
  });
