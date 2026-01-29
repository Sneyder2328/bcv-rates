/**
 * BCV Rates Mobile App
 * Phase 2: App skeleton + UI foundation
 */

import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { RootNavigator } from "./navigation/RootNavigator";
import { AppProviders } from "./providers";
import { ThemeProvider, useTheme } from "./theme";

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppProviders>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppProviders>
      <Toast />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
