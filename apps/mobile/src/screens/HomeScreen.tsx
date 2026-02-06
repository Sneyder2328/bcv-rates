import { formatRate } from "@bcv-rates/domain";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Banner, Button, Card } from "../components/primitives";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { AlertTriangle, Home, Settings, WifiOff } from "../icons";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { type ThemeColors, useTheme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { rates, statusLine, syncingRates, isOnline, isLoading, error } =
    useExchangeRates();
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  // Determine which banner to show (if any)
  const offlineBanner = !isOnline && rates;
  const offlineNoCacheBanner = !isOnline && !rates && !isLoading;
  const errorWithCacheBanner = isOnline && error && rates;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Home size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>BCV Rates</Text>
        </View>
        <View style={styles.headerRight}>
          <Button
            variant="ghost"
            onPress={() => navigation.navigate("Settings")}
          >
            <Settings size={24} color={colors.textMuted} />
          </Button>
        </View>
      </View>

      <View style={styles.content}>
        {/* Offline banner: has cached rates */}
        {offlineBanner ? (
          <Banner variant="warning" style={styles.banner}>
            <View style={styles.bannerRow}>
              <WifiOff size={16} color={colors.bannerWarning.text} />
              <Text
                style={[
                  styles.bannerText,
                  { color: colors.bannerWarning.text },
                ]}
              >
                Sin conexión — mostrando tasas guardadas
              </Text>
            </View>
          </Banner>
        ) : null}

        {/* Offline banner: no cached rates at all */}
        {offlineNoCacheBanner ? (
          <Banner variant="error" style={styles.banner}>
            <View style={styles.bannerRow}>
              <WifiOff size={16} color={colors.bannerError.text} />
              <Text
                style={[styles.bannerText, { color: colors.bannerError.text }]}
              >
                Sin conexión. Abre la app una vez con internet para guardar las
                tasas.
              </Text>
            </View>
          </Banner>
        ) : null}

        {/* Error banner: online error but we still have cached rates */}
        {errorWithCacheBanner ? (
          <Banner variant="warning" style={styles.banner}>
            <View style={styles.bannerRow}>
              <AlertTriangle size={16} color={colors.bannerWarning.text} />
              <Text
                style={[
                  styles.bannerText,
                  { color: colors.bannerWarning.text },
                ]}
              >
                Error al actualizar — mostrando tasas guardadas
              </Text>
            </View>
          </Banner>
        ) : null}

        <Card style={styles.card}>
          {/* Status line / date */}
          <View style={styles.statusRow}>
            {syncingRates ? (
              <ActivityIndicator
                size="small"
                color={colors.textMuted}
                style={styles.spinner}
              />
            ) : null}
            {statusLine ? (
              <Text style={styles.statusText}>{statusLine}</Text>
            ) : null}
          </View>

          {/* Rate display */}
          {rates ? (
            <View style={styles.ratesContainer}>
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>USD</Text>
                <Text style={styles.rateValue}>
                  Bs. {formatRate(rates.usd)}
                </Text>
              </View>
              <View style={styles.rateDivider} />
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>EUR</Text>
                <Text style={styles.rateValue}>
                  Bs. {formatRate(rates.eur)}
                </Text>
              </View>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando tasas…</Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.navButtons}>
          <Button
            variant="outline"
            onPress={() => navigation.navigate("History")}
            style={styles.navButton}
          >
            View History
          </Button>
          <Button
            variant="outline"
            onPress={() => navigation.navigate("Auth")}
            style={styles.navButton}
          >
            Sign In
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    content: {
      flex: 1,
      padding: 16,
    },
    banner: {
      marginBottom: 12,
    },
    bannerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    bannerText: {
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
    },
    card: {
      marginBottom: 16,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    spinner: {
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      color: colors.textMuted,
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
      color: colors.textSecondary,
    },
    rateValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    rateDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    navButtons: {
      flexDirection: "row",
      gap: 12,
    },
    navButton: {
      flex: 1,
    },
  });
