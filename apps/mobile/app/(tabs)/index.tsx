import { formatAmount } from "@bcv-rates/domain";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { track } from "../../src/analytics/umami";
import { useAuth } from "../../src/auth";
import { CurrencyInput } from "../../src/components/CurrencyInput";
import { CustomRateInput } from "../../src/components/CustomRateInput";
import {
  Banner,
  Button,
  Card,
  SectionDivider,
} from "../../src/components/primitives";
import { RateDateSelector } from "../../src/components/RateDateSelector";
import { SavedRatesList } from "../../src/components/SavedRatesList";
import { useCurrencyConverter } from "../../src/hooks/useCurrencyConverter";
import { useCustomRates } from "../../src/hooks/useCustomRates";
import { useExchangeRates } from "../../src/hooks/useExchangeRates";
import {
  ExternalLink,
  LogOut,
  Settings,
  Shield,
  User,
  WifiOff,
} from "../../src/icons";
import { type ThemeColors, useTheme } from "../../src/theme";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { user, loading: authLoading, signOut } = useAuth();

  const {
    rates,
    error,
    isLoading,
    syncingRates,
    statusLine,
    secondaryStatusLine,
    isOnline,
    selectedDate,
    setSelectedDate,
    currentEffectiveDate,
    maxSelectableDate,
    refetch,
  } = useExchangeRates();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

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
      track("auth_signout");
      await signOut();
      Toast.show({ type: "success", text1: "Sesión cerrada" });
    } catch {
      Toast.show({ type: "error", text1: "Error al cerrar sesión" });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
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

        {/* Error banner */}
        {isOnline && error && (
          <Banner variant="error" style={styles.banner}>
            <Text
              style={[styles.bannerText, { color: colors.bannerError.text }]}
            >
              {error}
            </Text>
          </Banner>
        )}

        {/* Navbar — user/auth section */}
        {authLoading ? null : user ? (
          <View style={styles.navbar}>
            <View style={styles.navbarLeft}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(user.displayName ?? user.email ?? "?")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.navbarUserInfo}>
                <Text
                  style={styles.navbarUserName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user.displayName ?? user.email ?? "Usuario"}
                </Text>
                <Text style={styles.navbarUserSub}>Sesión activa</Text>
              </View>
            </View>
            <View style={styles.navbarActions}>
              <Button
                variant="ghost"
                onPress={() => {
                  track("settings_open");
                  router.push("/settings" as never);
                }}
                style={styles.navbarIconBtn}
              >
                <Settings size={18} color={colors.textSecondary} />
              </Button>
              <Button
                variant="ghost"
                onPress={handleSignOut}
                style={styles.navbarIconBtn}
              >
                <LogOut size={18} color={colors.textSecondary} />
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.navbar}>
            <View style={styles.navbarLeft}>
              <View style={styles.navbarUserInfo}>
                <Text style={styles.navbarUserName}>El Cambio</Text>
                <Text style={styles.navbarUserSub}>No hay sesión activa</Text>
              </View>
            </View>
            <View style={styles.navbarActions}>
              <Button
                variant="outline"
                onPress={() => {
                  track("auth_open", { mode: "login" });
                  router.push("/auth");
                }}
                style={styles.navbarAuthBtn}
              >
                <User size={14} color={colors.textSecondary} />
                <Text style={styles.navbarAuthBtnText}>Login</Text>
              </Button>
            </View>
          </View>
        )}

        {/* Single main card */}
        <Card style={styles.mainCard}>
          {/* Gradient top strip */}
          <LinearGradient
            colors={["#6366f1", "#a855f7", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientStrip}
          />

          {/* Card header — like web's ExchangeRateHeader */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle}>
                El Cambio - Convertidor de bolívares
              </Text>
              <View style={styles.statusRow}>
                {syncingRates && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
                <Text style={styles.statusLine}>
                  {isLoading && !rates ? "Cargando tasas…" : statusLine}
                </Text>
              </View>
              {secondaryStatusLine ? (
                <Text style={styles.secondaryStatusLine}>
                  {secondaryStatusLine}
                </Text>
              ) : null}
            </View>
            <View style={styles.flagBadge}>
              <Text style={styles.flagEmoji}>🇻🇪</Text>
            </View>
          </View>

          {/* Card content */}
          <View style={styles.cardContent}>
            {/* VES input */}
            <CurrencyInput
              label="Bolívares (VES)"
              value={bolivars}
              onChangeText={onBolivarsChange}
              disabled={disabled}
              symbol="Bs."
              focusColor="indigo"
              inputSize="lg"
              showCopy
            />

            <SectionDivider label="Tasas de Cambio" />

            <View style={styles.converterRow}>
              <View style={styles.converterCol}>
                <CurrencyInput
                  label="Dólares (USD)"
                  value={usd}
                  onChangeText={onUsdChange}
                  disabled={disabled}
                  symbol="$"
                  focusColor="emerald"
                  showCopy
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
                  showCopy
                  exchangeRate={
                    rates ? `1 EUR = ${formatAmount(rates.eur)} Bs` : undefined
                  }
                  deltaPercent={eurDelta}
                />
              </View>
            </View>

            <SectionDivider label="Tasas Personalizadas" />

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
                  track("custom_rate_select", { source: "main" });
                  setCustomUnitLabel(label);
                  onCustomRateChange(formattedRate);
                }}
              />
            )}

            <SectionDivider label="Otra Fecha" />

            <RateDateSelector
              value={selectedDate ?? currentEffectiveDate}
              max={maxSelectableDate}
              disabled={!currentEffectiveDate}
              onChange={setSelectedDate}
            />
          </View>
        </Card>

        {/* Footer — outside card, like web */}
        <View style={styles.footer}>
          <Text style={styles.sourceText}>
            Fuente: Banco Central de Venezuela
          </Text>
          <Button
            variant="ghost"
            onPress={() =>
              Linking.openURL(
                "https://cambio.sneyderangulo.com/privacy-policy.html",
              )
            }
            style={styles.footerLink}
          >
            <Shield size={12} color={colors.textMuted} />
            <Text style={styles.footerLinkText}>Política de Privacidad</Text>
            <ExternalLink size={10} color={colors.textMuted} />
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    scrollContent: {
      padding: 10,
      paddingBottom: 32,
    },

    // Banners
    banner: {
      marginBottom: 8,
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

    // Navbar (user/auth bar above card)
    navbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    navbarLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    avatarCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primaryText,
    },
    navbarUserInfo: {
      flex: 1,
      minWidth: 0,
    },
    navbarUserName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    navbarUserSub: {
      fontSize: 12,
      color: colors.textMuted,
    },
    navbarActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    navbarIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    navbarAuthBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      flexDirection: "row",
      gap: 6,
    },
    navbarAuthBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    // Main card
    mainCard: {
      padding: 0,
      overflow: "hidden",
    },
    gradientStrip: {
      height: 3,
      width: "100%",
    },

    // Card header (like web ExchangeRateHeader)
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 14,
      paddingBottom: 10,
    },
    cardHeaderLeft: {
      flex: 1,
      gap: 4,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    statusLine: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textMuted,
    },
    secondaryStatusLine: {
      fontSize: 12,
      color: colors.bannerWarning.text,
      fontWeight: "500",
      marginTop: 2,
    },
    flagBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
    flagEmoji: {
      fontSize: 18,
    },

    // Card content
    cardContent: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      gap: 12,
    },

    // Converter
    converterRow: {
      flexDirection: "row",
      gap: 8,
    },
    converterCol: {
      flex: 1,
    },

    // Footer — outside card
    footer: {
      marginTop: 14,
      alignItems: "center",
      gap: 4,
    },
    sourceText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "500",
    },
    footerLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    footerLinkText: {
      fontSize: 11,
      color: colors.textMuted,
    },
  });
