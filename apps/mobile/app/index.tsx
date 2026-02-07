import { formatAmount } from "@bcv-rates/domain";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../src/auth";
import { CurrencyInput } from "../src/components/CurrencyInput";
import { CustomRateInput } from "../src/components/CustomRateInput";
import {
  Banner,
  Button,
  Card,
  SectionDivider,
} from "../src/components/primitives";
import { SavedRatesList } from "../src/components/SavedRatesList";
import { useCurrencyConverter } from "../src/hooks/useCurrencyConverter";
import { useCustomRates } from "../src/hooks/useCustomRates";
import {
  formatRateDisplay,
  useExchangeRates,
} from "../src/hooks/useExchangeRates";
import { Home, LogOut, Settings, User, WifiOff } from "../src/icons";
import { type ThemeColors, useTheme } from "../src/theme";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { user, loading: authLoading, signOut } = useAuth();

  const { rates, error, isLoading, syncingRates, statusLine, isOnline } =
    useExchangeRates();

  const {
    bolivars,
    usd,
    eur,
    customRate,
    customAmount,
    onBolivarsChange,
    onUsdChange,
    onEurChange,
    onCustomRateChange,
    onCustomAmountChange,
  } = useCurrencyConverter(rates);

  const [customUnitLabel, setCustomUnitLabel] = useState("★");

  const {
    items: savedRates,
    isLoading: savedRatesLoading,
    error: savedRatesError,
  } = useCustomRates();

  // Reset unit label when user signs out
  useEffect(() => {
    if (!user) setCustomUnitLabel("★");
  }, [user]);

  const disabled = !rates;

  const usdDelta =
    rates?.usdPrevious != null
      ? ((rates.usd - rates.usdPrevious) / rates.usdPrevious) * 100
      : undefined;

  const eurDelta =
    rates?.eurPrevious != null
      ? ((rates.eur - rates.eurPrevious) / rates.eurPrevious) * 100
      : undefined;

  const handleSignOut = async () => {
    try {
      await signOut();
      Toast.show({ type: "success", text1: "Sesión cerrada" });
    } catch {
      Toast.show({ type: "error", text1: "Error al cerrar sesión" });
    }
  };

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

        {/* Converter */}
        <Card style={styles.card}>
          {/* VES input */}
          <CurrencyInput
            label="Bolívares (VES)"
            value={bolivars}
            onChangeText={onBolivarsChange}
            disabled={disabled}
            symbol="Bs."
            focusColor="indigo"
            inputSize="lg"
          />

          <SectionDivider label="Tasas de Cambio" />

          {/* USD / EUR side-by-side on wider screens, stacked on narrow */}
          <View style={styles.converterRow}>
            <View style={styles.converterCol}>
              <CurrencyInput
                label="Dólares (USD)"
                value={usd}
                onChangeText={onUsdChange}
                disabled={disabled}
                symbol="$"
                focusColor="emerald"
                exchangeRate={
                  rates ? `1 USD = ${formatAmount(rates.usd)} Bs` : undefined
                }
                deltaPercent={usdDelta}
              />
            </View>
            <View style={styles.converterCol}>
              <CurrencyInput
                label="Euros (EUR)"
                value={eur}
                onChangeText={onEurChange}
                disabled={disabled}
                symbol="€"
                focusColor="blue"
                exchangeRate={
                  rates ? `1 EUR = ${formatAmount(rates.eur)} Bs` : undefined
                }
                deltaPercent={eurDelta}
              />
            </View>
          </View>

          <SectionDivider label="Tasa Personalizada" />

          <CustomRateInput
            rateValue={customRate}
            amountValue={customAmount}
            onRateChange={onCustomRateChange}
            onAmountChange={onCustomAmountChange}
            disabled={disabled}
            unitLabel={customUnitLabel}
          />

          {user && (
            <SavedRatesList
              items={savedRates}
              isLoading={savedRatesLoading}
              error={savedRatesError}
              activeLabel={customUnitLabel}
              onRateSelect={(label, formattedRate) => {
                setCustomUnitLabel(label);
                onCustomRateChange(formattedRate);
              }}
            />
          )}
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

        {/* Auth section */}
        {authLoading ? null : user ? (
          <Card style={styles.userCard}>
            <View style={styles.userRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(user.displayName ?? user.email ?? "?")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                {user.displayName ? (
                  <Text
                    style={styles.userName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {user.displayName}
                  </Text>
                ) : null}
                <Text
                  style={styles.userEmail}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {user.email ?? user.uid}
                </Text>
              </View>
              <Button variant="ghost" onPress={handleSignOut}>
                <LogOut size={20} color={colors.textMuted} />
              </Button>
            </View>
          </Card>
        ) : (
          <Button
            variant="outline"
            onPress={() => router.push("/auth")}
            style={styles.authButton}
          >
            <User size={18} color={colors.textSecondary} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.textSecondary,
              }}
            >
              Iniciar sesión
            </Text>
          </Button>
        )}
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
    // Converter
    converterRow: {
      flexDirection: "row",
      gap: 12,
    },
    converterCol: {
      flex: 1,
    },
    navButtons: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    navButton: {
      flex: 1,
    },
    // Auth section
    authButton: {
      marginTop: 4,
    },
    userCard: {
      marginTop: 4,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primaryText,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    userEmail: {
      fontSize: 12,
      color: colors.textMuted,
    },
  });
