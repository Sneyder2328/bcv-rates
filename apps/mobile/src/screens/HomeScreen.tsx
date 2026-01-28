import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Button, Card } from "../components/primitives";
import { Home, Settings } from "../icons";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
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
        <Home size={24} color="#2563eb" />
        <Text style={styles.title}>BCV Rates</Text>
        <Button variant="ghost" onPress={() => navigation.navigate("Settings")}>
          <Settings size={24} color="#6b7280" />
        </Button>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Exchange Rate</Text>
          <Text style={styles.placeholder}>
            Rate display will be implemented in Phase 3
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
