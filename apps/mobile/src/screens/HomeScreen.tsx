import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Button, Card } from "../components/primitives";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { Home, Settings } from "../icons";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { rates, statusLine, syncingRates, lastUpdated, isOnline } =
    useExchangeRates();

  const showTestToast = () => {
    Toast.show({
      type: "success",
      text1: "Toast Test",
      text2: "Toast message is working correctly!",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Home size={24} color="#2563eb" />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>BCV Rates</Text>
        </View>
        <View style={styles.headerRight}>
          <Button
            variant="ghost"
            onPress={() => navigation.navigate("Settings")}
          >
            <Settings size={24} color="#6b7280" />
          </Button>
        </View>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Exchange Rate</Text>
          {statusLine ? (
            <Text style={styles.placeholder}>{statusLine}</Text>
          ) : null}
          <Text style={styles.rateLine}>
            USD: {rates ? String(rates.usd) : "—"}
          </Text>
          <Text style={styles.rateLine}>
            EUR: {rates ? String(rates.eur) : "—"}
          </Text>
          <Text style={styles.metaLine}>
            {syncingRates
              ? "Actualizando…"
              : isOnline
                ? "En línea"
                : "Sin conexión"}
            {lastUpdated ? ` · Cache: ${lastUpdated}` : ""}
          </Text>
        </Card>

        <Button onPress={showTestToast} style={styles.toastButton}>
          Test Toast Message
        </Button>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    color: "#111827",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: "#6b7280",
  },
  rateLine: {
    fontSize: 16,
    color: "#111827",
    marginTop: 6,
  },
  metaLine: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
  toastButton: {
    marginBottom: 24,
  },
  navButtons: {
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
});
