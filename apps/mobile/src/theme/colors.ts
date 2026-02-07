/**
 * Theme color definitions for light and dark modes.
 * Based on Tailwind CSS color palette for consistency with the web app.
 */

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  cardBackground: string;
  cardShadow: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;

  // Borders
  border: string;
  borderError: string;

  // Primary (blue)
  primary: string;
  primaryText: string;

  // Secondary (slate)
  secondary: string;
  secondaryText: string;

  // Banners
  bannerInfo: { bg: string; text: string };
  bannerSuccess: { bg: string; text: string };
  bannerWarning: { bg: string; text: string };
  bannerError: { bg: string; text: string };

  // Input
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;

  // Divider
  divider: string;

  // Disabled states
  disabledText: string;
}

export const lightColors: ThemeColors = {
  background: "#f9fafb",
  backgroundSecondary: "#ffffff",
  cardBackground: "#ffffff",
  cardShadow: "#000000",

  text: "#111827",
  textSecondary: "#374151",
  textMuted: "#6b7280",

  border: "#e5e7eb",
  borderError: "#ef4444",

  primary: "#2563eb",
  primaryText: "#ffffff",

  secondary: "#64748b",
  secondaryText: "#ffffff",

  bannerInfo: { bg: "#dbeafe", text: "#1e40af" },
  bannerSuccess: { bg: "#dcfce7", text: "#166534" },
  bannerWarning: { bg: "#fef3c7", text: "#92400e" },
  bannerError: { bg: "#fee2e2", text: "#991b1b" },

  inputBackground: "#f9fafb",
  inputBorder: "#e5e7eb",
  inputText: "#111827",
  inputPlaceholder: "#9ca3af",

  divider: "#e5e7eb",

  disabledText: "#9ca3af",
};

export const darkColors: ThemeColors = {
  background: "#111827",
  backgroundSecondary: "#1f2937",
  cardBackground: "#1f2937",
  cardShadow: "#000000",

  text: "#f9fafb",
  textSecondary: "#e5e7eb",
  textMuted: "#9ca3af",

  border: "#374151",
  borderError: "#f87171",

  primary: "#3b82f6",
  primaryText: "#ffffff",

  secondary: "#94a3b8",
  secondaryText: "#1e293b",

  bannerInfo: { bg: "#1e3a5f", text: "#93c5fd" },
  bannerSuccess: { bg: "#14532d", text: "#86efac" },
  bannerWarning: { bg: "#78350f", text: "#fcd34d" },
  bannerError: { bg: "#7f1d1d", text: "#fca5a5" },

  inputBackground: "#374151",
  inputBorder: "#4b5563",
  inputText: "#f9fafb",
  inputPlaceholder: "#9ca3af",

  divider: "#374151",

  disabledText: "#6b7280",
};
