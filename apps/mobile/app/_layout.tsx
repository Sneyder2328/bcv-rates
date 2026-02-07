import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { initUmami, setUmamiContext } from "../src/analytics/umami";
import { AuthProvider } from "../src/auth";
import { OnlineStatusProvider } from "../src/hooks/useOnlineStatus";
import { QueryProvider } from "../src/providers/QueryProvider";
import { TrpcProvider } from "../src/providers/TrpcProvider";
import { ThemeProvider, useTheme } from "../src/theme";

function getTitleForPathname(pathname: string): string {
  switch (pathname) {
    case "/":
      return "home";
    case "/settings":
      return "settings";
    case "/history":
      return "history";
    case "/auth":
      return "auth";
    default:
      return pathname.replace(/^\//, "") || "app";
  }
}

function RootLayoutNav() {
  const { isDark } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    initUmami();
  }, []);

  useEffect(() => {
    setUmamiContext({
      url: pathname || "/",
      title: getTitleForPathname(pathname || "/"),
    });
  }, [pathname]);

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
        <AuthProvider>
          <QueryProvider>
            <TrpcProvider>
              <OnlineStatusProvider>
                <RootLayoutNav />
              </OnlineStatusProvider>
            </TrpcProvider>
          </QueryProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
