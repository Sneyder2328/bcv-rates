import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { OnlineStatusProvider } from "../src/hooks/useOnlineStatus";
import { QueryProvider } from "../src/providers/QueryProvider";
import { TrpcProvider } from "../src/providers/TrpcProvider";
import { ThemeProvider, useTheme } from "../src/theme";

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="history" />
        <Stack.Screen
          name="auth"
          options={{
            presentation: "modal",
          }}
        />
      </Stack>
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryProvider>
          <TrpcProvider>
            <OnlineStatusProvider>
              <RootLayoutNav />
            </OnlineStatusProvider>
          </TrpcProvider>
        </QueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
