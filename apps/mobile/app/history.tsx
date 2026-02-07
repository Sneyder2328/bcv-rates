import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card } from "../src/components/primitives";
import { ChevronLeft } from "../src/icons";
import { type ThemeColors, useTheme } from "../src/theme";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Button variant="ghost" onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.textMuted} />
          </Button>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Historial</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Card>
          <Text style={styles.cardTitle}>Gráfico de Tasas</Text>
          <Text style={styles.cardSubtitle}>
            Historical chart (USD/EUR, 7/14/30/90d) coming in Phase 7.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) =>
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
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
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
  });
