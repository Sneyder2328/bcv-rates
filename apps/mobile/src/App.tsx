/**
 * BCV Rates Mobile App
 * Phase 2: App skeleton + UI foundation
 */

import { NavigationContainer } from "@react-navigation/native";
import { StatusBar, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { RootNavigator } from "./navigation/RootNavigator";
import { AuthProvider, TrpcProvider } from "./providers";

function App() {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <TrpcProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </TrpcProvider>
      <Toast />
    </SafeAreaProvider>
  );
}

export default App;
