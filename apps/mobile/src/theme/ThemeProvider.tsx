import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ThemeColors } from "./colors";

type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  colorScheme: ColorScheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const colorScheme: ColorScheme =
    systemColorScheme === "dark" ? "dark" : "light";
  const isDark = colorScheme === "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      colorScheme,
    }),
    [isDark, colorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
