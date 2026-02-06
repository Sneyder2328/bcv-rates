import { formatAmount, formatRate } from "@bcv-rates/domain";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { CurrencyInput } from "../components/CurrencyInput";
import { CustomRateInput } from "../components/CustomRateInput";
import { Banner, Button, Card, SectionDivider } from "../components/primitives";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { AlertTriangle, Home, LogOut, Settings, User, WifiOff } from "../icons";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../providers/AuthProvider";
import { type ThemeColors, useTheme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { rates, statusLine, syncingRates, isOnline, isLoading, error } =
    useExchangeRates();
  const converter = useCurrencyConverter(rates);
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  async function handleSignOut() {
    try {
      await signOut();
      Toast.show({ type: "success", text1: "Sesión cerrada" });
    } catch {
      Toast.show({ type: "error", text1: "Error al cerrar sesión" });
    }
  }

  const disabled = !rates;

  // Determine which banner to show (if any)
  const offlineBanner = !isOnline && !!rates;
  const offlineNoCacheBanner = !isOnline && !rates && !isLoading;
  const errorWithCacheBanner = !!error && isOnline && !!rates;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Banners */}
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

          {offlineNoCacheBanner ? (
            <Banner variant="error" style={styles.banner}>
              <View style={styles.bannerRow}>
                <WifiOff size={16} color={colors.bannerError.text} />
                <Text
                  style={[
                    styles.bannerText,
                    { color: colors.bannerError.text },
                  ]}
                >
                  Sin conexión. Abre la app una vez con internet para guardar
                  las tasas.
                </Text>
              </View>
            </Banner>
          ) : null}

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

          {/* Exchange rates card */}
          <Card style={styles.card}>
            {/* Status line */}
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

          {/* Converter section */}
          {rates ? (
            <>
              {/* VES input (primary) */}
              <CurrencyInput
                label="Bolívares (VES)"
                value={converter.bolivars}
                onChangeText={converter.onBolivarsChange}
                disabled={disabled}
                symbol="Bs."
                large
                style={styles.converterField}
              />

              <SectionDivider label="Tasas de Cambio" />

              {/* USD / EUR side by side */}
              <View style={styles.currencyRow}>
                <CurrencyInput
                  label="Dólares (USD)"
                  value={converter.usd}
                  onChangeText={converter.onUsdChange}
                  disabled={disabled}
                  symbol="$"
                  exchangeRate={`1 USD = ${formatAmount(rates.usd)} Bs`}
                  style={styles.currencyCol}
                />
                <CurrencyInput
                  label="Euros (EUR)"
                  value={converter.eur}
                  onChangeText={converter.onEurChange}
                  disabled={disabled}
                  symbol="€"
                  exchangeRate={`1 EUR = ${formatAmount(rates.eur)} Bs`}
                  style={styles.currencyCol}
                />
              </View>

              <SectionDivider label="Tasas Personalizadas" />

              {/* Custom rate */}
              <CustomRateInput
                rateValue={converter.customRate}
                amountValue={converter.customAmount}
                onRateChange={converter.onCustomRateChange}
                onAmountChange={converter.onCustomAmountChange}
                disabled={disabled}
              />
            </>
          ) : null}

          {/* User / auth section */}
          <SectionDivider label="Cuenta" />
          {user ? (
            <Card style={styles.userCard}>
              <View style={styles.userRow}>
                <User size={20} color={colors.primary} />
                <View style={styles.userInfo}>
                  {user.displayName ? (
                    <Text style={styles.userName}>{user.displayName}</Text>
                  ) : null}
                  {user.email ? (
                    <Text style={styles.userEmail}>{user.email}</Text>
                  ) : null}
                </View>
                <Button
                  variant="ghost"
                  onPress={() => void handleSignOut()}
                  style={styles.signOutButton}
                >
                  <LogOut size={20} color={colors.textMuted} />
                </Button>
              </View>
            </Card>
          ) : (
            <Button
              variant="outline"
              onPress={() => navigation.navigate("Auth")}
              style={styles.authButton}
            >
              Iniciar sesión
            </Button>
          )}

          {/* Nav buttons */}
          <View style={styles.navButtons}>
            <Button
              variant="outline"
              onPress={() => navigation.navigate("History")}
              style={styles.navButton}
            >
              Ver Historial
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
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
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
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
    converterField: {
      marginBottom: 4,
    },
    currencyRow: {
      flexDirection: "row",
      gap: 12,
    },
    currencyCol: {
      flex: 1,
    },
    userCard: {
      marginBottom: 8,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    userEmail: {
      fontSize: 13,
      color: colors.textMuted,
    },
    signOutButton: {
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    authButton: {
      marginBottom: 8,
    },
    navButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    navButton: {
      flex: 1,
    },
  });
