import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Button, Card } from "../src/components/primitives";
import { Home, Settings } from "../src/icons";
import { type ThemeColors, useTheme } from "../src/theme";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);

  function handleTestToast() {
    Toast.show({
      type: "success",
      text1: "Toast funciona",
      text2: "react-native-toast-message wired correctly",
    });
  }

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
        {/* Rates placeholder */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Tasas de Cambio</Text>
          <Text style={styles.cardSubtitle}>
            Exchange rates will appear here once the data layer is connected.
          </Text>
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
          <Button
            variant="outline"
            onPress={handleTestToast}
            style={styles.navButton}
          >
            Test Toast
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
