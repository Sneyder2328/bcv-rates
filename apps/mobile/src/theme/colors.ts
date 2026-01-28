/**
 * Theme color definitions for light and dark modes
 * Based on Tailwind CSS color palette for consistency with web app
 */

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  card: string;
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
  // Backgrounds
  background: "#f9fafb", // gray-50
  backgroundSecondary: "#ffffff",
  card: "#ffffff",
  cardShadow: "#000000",

  // Text
  text: "#111827", // gray-900
  textSecondary: "#374151", // gray-700
  textMuted: "#6b7280", // gray-500

  // Borders
  border: "#e5e7eb", // gray-200
  borderError: "#ef4444", // red-500

  // Primary (blue)
  primary: "#2563eb", // blue-600
  primaryText: "#ffffff",

  // Secondary (slate)
  secondary: "#64748b", // slate-500
  secondaryText: "#ffffff",

  // Banners
  bannerInfo: { bg: "#dbeafe", text: "#1e40af" }, // blue-100, blue-800
  bannerSuccess: { bg: "#dcfce7", text: "#166534" }, // green-100, green-800
  bannerWarning: { bg: "#fef3c7", text: "#92400e" }, // amber-100, amber-800
  bannerError: { bg: "#fee2e2", text: "#991b1b" }, // red-100, red-800

  // Input
  inputBackground: "#f9fafb", // gray-50
  inputBorder: "#e5e7eb", // gray-200
  inputText: "#111827", // gray-900
  inputPlaceholder: "#9ca3af", // gray-400

  // Divider
  divider: "#e5e7eb", // gray-200

  // Disabled states
  disabledText: "#9ca3af", // gray-400
};

export const darkColors: ThemeColors = {
  // Backgrounds
  background: "#111827", // gray-900
  backgroundSecondary: "#1f2937", // gray-800
  card: "#1f2937", // gray-800
  cardShadow: "#000000",

  // Text
  text: "#f9fafb", // gray-50
  textSecondary: "#e5e7eb", // gray-200
  textMuted: "#9ca3af", // gray-400

  // Borders
  border: "#374151", // gray-700
  borderError: "#f87171", // red-400

  // Primary (blue)
  primary: "#3b82f6", // blue-500
  primaryText: "#ffffff",

  // Secondary (slate)
  secondary: "#94a3b8", // slate-400
  secondaryText: "#1e293b", // slate-800

  // Banners
  bannerInfo: { bg: "#1e3a5f", text: "#93c5fd" }, // custom dark blue, blue-300
  bannerSuccess: { bg: "#14532d", text: "#86efac" }, // green-900, green-300
  bannerWarning: { bg: "#78350f", text: "#fcd34d" }, // amber-900, amber-300
  bannerError: { bg: "#7f1d1d", text: "#fca5a5" }, // red-900, red-300

  // Input
  inputBackground: "#374151", // gray-700
  inputBorder: "#4b5563", // gray-600
  inputText: "#f9fafb", // gray-50
  inputPlaceholder: "#9ca3af", // gray-400

  // Divider
  divider: "#374151", // gray-700

  // Disabled states
  disabledText: "#6b7280", // gray-500
};
