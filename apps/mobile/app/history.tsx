import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import { track } from "../src/analytics/umami";
import { useAuth } from "../src/auth";
import { Banner, Button, Card } from "../src/components/primitives";
import type {
  ChartDataPoint,
  HistoryCurrency,
  HistoryRange,
} from "../src/hooks/useHistoricalRates";
import { useHistoricalRates } from "../src/hooks/useHistoricalRates";
import { useOnlineStatus } from "../src/hooks/useOnlineStatus";
import { ChevronLeft, TrendingUp, WifiOff } from "../src/icons";
import { type ThemeColors, useTheme } from "../src/theme";

const RANGE_OPTIONS: { value: HistoryRange; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 365, label: "1a" },
];

const SCREEN_WIDTH = Dimensions.get("window").width;
// Chart occupies full card width minus card padding (16*2) and screen padding (16*2)
const CHART_WIDTH = SCREEN_WIDTH - 64 - 40; // extra 40 for y-axis labels

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [currency, setCurrency] = useState<HistoryCurrency>("USD");
  const [days, setDays] = useState<HistoryRange>(30);

  const { chartData, isLoading, isFetching, error, isEmpty } =
    useHistoricalRates(currency, days);

  const didTrackViewed = useRef(false);
  useEffect(() => {
    if (!user) return;
    if (didTrackViewed.current) return;
    didTrackViewed.current = true;
    track("history_viewed", { currency, days });
  }, [currency, days, user]);

  const isUsd = currency === "USD";
  const accentColor = isUsd ? colors.accentEmerald : colors.accentBlue;

  // Compute tick spacing so we show ~5-7 x-axis labels
  const xAxisLabelInterval = useMemo(() => {
    if (chartData.length <= 7) return 1;
    return Math.ceil(chartData.length / 6);
  }, [chartData.length]);

  // Prepare data for gifted-charts: only show label every N points
  const formattedData = useMemo(() => {
    return chartData.map((point, index) => ({
      value: point.value,
      label: index % xAxisLabelInterval === 0 ? point.label : "",
      dataPointText: undefined as string | undefined,
    }));
  }, [chartData, xAxisLabelInterval]);

  // Compute y-axis bounds with some padding
  const yAxisConfig = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100, sections: 4 };
    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const padding = range * 0.1;
    return {
      min: Math.floor((min - padding) * 100) / 100,
      max: Math.ceil((max + padding) * 100) / 100,
      sections: 4,
    };
  }, [chartData]);

  const spacing = useMemo(() => {
    if (formattedData.length <= 1) return 40;
    return Math.max(CHART_WIDTH / (formattedData.length - 1), 10);
  }, [formattedData.length]);

  const handleCurrencyToggle = useCallback((c: HistoryCurrency) => {
    setCurrency(c);
  }, []);

  const handleRangeSelect = useCallback((r: HistoryRange) => {
    setDays(r);
  }, []);

  // Not authenticated — prompt sign-in
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header colors={colors} styles={styles} onBack={() => router.back()} />
        <View style={styles.centeredContent}>
          <TrendingUp size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Historial de Tasas</Text>
          <Text style={styles.emptySubtitle}>
            Inicia sesión para ver el historial de tasas de cambio.
          </Text>
          <Button
            style={styles.signInButton}
            onPress={() => {
              track("auth_open", { mode: "login" });
              router.push("/auth");
            }}
          >
            Iniciar sesión
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header colors={colors} styles={styles} onBack={() => router.back()} />

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
                {chartData.length > 0 ? " — mostrando datos guardados" : ""}
              </Text>
            </View>
          </Banner>
        )}

        {/* Controls */}
        <View style={styles.controlsRow}>
          {/* Currency toggle */}
          <View style={styles.toggleContainer}>
            <Pressable
              style={[
                styles.toggleButton,
                currency === "USD" && {
                  backgroundColor: `${colors.accentEmerald}25`,
                },
              ]}
              onPress={() => handleCurrencyToggle("USD")}
            >
              <Text
                style={[
                  styles.toggleText,
                  currency === "USD" && {
                    color: colors.accentEmerald,
                    fontWeight: "700",
                  },
                ]}
              >
                USD
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleButton,
                currency === "EUR" && {
                  backgroundColor: `${colors.accentBlue}25`,
                },
              ]}
              onPress={() => handleCurrencyToggle("EUR")}
            >
              <Text
                style={[
                  styles.toggleText,
                  currency === "EUR" && {
                    color: colors.accentBlue,
                    fontWeight: "700",
                  },
                ]}
              >
                EUR
              </Text>
            </Pressable>
          </View>

          {/* Range selector */}
          <View style={styles.rangeContainer}>
            {RANGE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.rangeButton,
                  days === opt.value && {
                    backgroundColor: `${colors.primary}20`,
                  },
                ]}
                onPress={() => handleRangeSelect(opt.value)}
              >
                <Text
                  style={[
                    styles.rangeText,
                    days === opt.value && {
                      color: colors.primary,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Error */}
        {isOnline && error && (
          <Banner variant="error" style={styles.banner}>
            <Text
              style={[styles.bannerText, { color: colors.bannerError.text }]}
            >
              {error}
            </Text>
          </Banner>
        )}

        {/* Chart card */}
        <Card style={styles.chartCard}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={styles.loadingText}>Cargando historial…</Text>
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyChartText}>
                {!isOnline
                  ? "Sin conexión. Conéctate para cargar el historial."
                  : `No hay historial disponible para ${currency}.`}
              </Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              {isFetching && (
                <ActivityIndicator
                  size="small"
                  color={accentColor}
                  style={styles.fetchingIndicator}
                />
              )}
              <LineChart
                data={formattedData}
                areaChart
                curved
                height={220}
                width={CHART_WIDTH}
                spacing={spacing}
                color={accentColor}
                thickness={2}
                startFillColor={accentColor}
                endFillColor={accentColor}
                startOpacity={0.3}
                endOpacity={0.02}
                noOfSections={yAxisConfig.sections}
                yAxisOffset={yAxisConfig.min}
                maxValue={yAxisConfig.max - yAxisConfig.min}
                yAxisTextStyle={{
                  color: colors.textMuted,
                  fontSize: 10,
                }}
                xAxisLabelTextStyle={{
                  color: colors.textMuted,
                  fontSize: 9,
                  width: 50,
                  textAlign: "center",
                }}
                xAxisColor={colors.border}
                yAxisColor="transparent"
                rulesColor={isDark ? "#ffffff10" : "#00000008"}
                rulesType="dashed"
                hideDataPoints
                adjustToWidth
                formatYLabel={(val) =>
                  (Number(val) + yAxisConfig.min).toFixed(2)
                }
                pointerConfig={{
                  pointerStripColor: accentColor,
                  pointerStripWidth: 1,
                  pointerColor: accentColor,
                  radius: 5,
                  pointerLabelWidth: 120,
                  pointerLabelHeight: 50,
                  activatePointersOnLongPress: false,
                  pointerLabelComponent: (
                    items: { value: number; index?: number }[],
                  ) => {
                    const item = items[0];
                    if (!item) return null;
                    const idx =
                      item.index ??
                      formattedData.findIndex((d) => d.value === item.value);
                    const point: ChartDataPoint | undefined = chartData[idx];
                    return (
                      <View style={tooltipStyles(colors).container}>
                        <Text style={tooltipStyles(colors).date}>
                          {point?.fullDate ?? ""}
                        </Text>
                        <Text style={tooltipStyles(colors).value}>
                          Bs. {(item.value + yAxisConfig.min).toFixed(2)}
                        </Text>
                      </View>
                    );
                  },
                }}
              />
            </View>
          )}
        </Card>

        {/* Summary stats */}
        {chartData.length > 0 && <StatsCard data={chartData} colors={colors} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({
  colors,
  styles,
  onBack,
}: {
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Button variant="ghost" onPress={onBack}>
          <ChevronLeft size={24} color={colors.textMuted} />
        </Button>
      </View>
      <View style={styles.headerCenter}>
        <TrendingUp size={20} color={colors.primary} />
        <Text style={styles.title}>Historial</Text>
      </View>
      <View style={styles.headerRight} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stats card — min, max, average
// ---------------------------------------------------------------------------

function StatsCard({
  data,
  colors,
}: {
  data: ChartDataPoint[];
  colors: ThemeColors;
}) {
  const stats = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const minPoint = data.find((d) => d.value === min);
    const maxPoint = data.find((d) => d.value === max);
    return {
      min,
      max,
      avg,
      minDate: minPoint?.fullDate,
      maxDate: maxPoint?.fullDate,
    };
  }, [data]);

  return (
    <Card>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 8,
        }}
      >
        Resumen del período
      </Text>
      <View style={{ gap: 6 }}>
        <StatRow
          label="Mínimo"
          value={`Bs. ${stats.min.toFixed(2)}`}
          detail={stats.minDate}
          colors={colors}
        />
        <StatRow
          label="Máximo"
          value={`Bs. ${stats.max.toFixed(2)}`}
          detail={stats.maxDate}
          colors={colors}
        />
        <StatRow
          label="Promedio"
          value={`Bs. ${stats.avg.toFixed(2)}`}
          colors={colors}
        />
      </View>
    </Card>
  );
}

function StatRow({
  label,
  value,
  detail,
  colors,
}: {
  label: string;
  value: string;
  detail?: string;
  colors: ThemeColors;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 13, color: colors.textMuted }}>{label}</Text>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
          {value}
        </Text>
        {detail && (
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {detail}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tooltip styles
// ---------------------------------------------------------------------------

const tooltipStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: "center",
    },
    date: {
      fontSize: 10,
      color: colors.textMuted,
      marginBottom: 2,
    },
    value: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
  });

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    headerRight: {
      width: 48,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },

    // Controls
    controlsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    toggleContainer: {
      flexDirection: "row",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    toggleButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textMuted,
    },
    rangeContainer: {
      flexDirection: "row",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    rangeButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    rangeText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textMuted,
    },

    // Banner
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

    // Chart
    chartCard: {
      marginBottom: 16,
      overflow: "hidden",
    },
    chartWrapper: {
      position: "relative",
    },
    fetchingIndicator: {
      position: "absolute",
      top: 4,
      right: 4,
      zIndex: 1,
    },

    // Loading / empty
    loadingContainer: {
      paddingVertical: 60,
      alignItems: "center",
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    emptyContainer: {
      paddingVertical: 60,
      alignItems: "center",
    },
    emptyChartText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
    },

    // Unauthenticated
    centeredContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
    },
    signInButton: {
      marginTop: 8,
    },
  });
