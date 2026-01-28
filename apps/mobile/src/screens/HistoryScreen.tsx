import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card } from "../components/primitives";
import { ArrowLeft, History } from "../icons";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

export function HistoryScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#6b7280" />
          </Button>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Rate History</Text>
        </View>
        <View style={styles.headerRight}>
          <History size={24} color="#2563eb" />
        </View>
      </View>

      <View style={styles.content}>
        <Card>
          <Text style={styles.cardTitle}>Historical Rates</Text>
          <Text style={styles.placeholder}>
            Chart and historical data will be implemented in Phase 3
          </Text>
        </Card>
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
});
