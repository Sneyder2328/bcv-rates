/**
 * BCV Rates Mobile App
 * https://github.com/facebook/react-native
 */

import { formatRate } from "@bcv-rates/domain";
import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

function App() {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <AppContent isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}

function AppContent({ isDarkMode }: { isDarkMode: boolean }) {
  // Test that @bcv-rates/domain is working
  const testRate = formatRate(36.5);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#1a1a2e" : "#f5f5f5" },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>
          BCV Rates
        </Text>
        <Text
          style={[styles.subtitle, { color: isDarkMode ? "#ccc" : "#666" }]}
        >
          Mobile App
        </Text>
        <View style={styles.testContainer}>
          <Text
            style={[styles.testLabel, { color: isDarkMode ? "#aaa" : "#888" }]}
          >
            Domain package test:
          </Text>
          <Text
            style={[
              styles.testValue,
              { color: isDarkMode ? "#4ade80" : "#16a34a" },
            ]}
          >
            formatRate(36.5) = {testRate}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
  },
  testContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  testLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  testValue: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default App;
