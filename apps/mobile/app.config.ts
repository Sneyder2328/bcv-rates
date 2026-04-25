import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ConfigContext, ExpoConfig } from "expo/config";

const REQUIRED_ENV_KEYS = [
  "API_BASE_URL",
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_APP_ID",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_STORAGE_BUCKET",
  "GOOGLE_WEB_CLIENT_ID",
] as const;

function loadEnvFile(filePath: string) {
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const envPath = path.resolve(__dirname, ".env");
if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

for (const key of REQUIRED_ENV_KEYS) {
  if (!process.env[key]) {
    console.warn(`[app.config] Missing ${key} while generating Expo config.`);
  }
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "El Cambio",
  slug: "elcambio",
  version: "1.2.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  scheme: "elcambio",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sneyderangulo.elcambio",
  },
  android: {
    jsEngine: "hermes",
    icon: "./assets/icon.png",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    edgeToEdgeEnabled: true,
    package: "com.sneyderangulo.elcambio",
    versionCode: 7,
    googleServicesFile: "./google-services.json",
  },
  plugins: ["expo-router", "@react-native-google-signin/google-signin"],
  extra: {
    eas: {
      projectId: "dc72637c-307d-494a-9a86-aec419a7cc62",
    },
    apiBaseUrl: process.env.API_BASE_URL || "",
    // Umami analytics (gated by UMAMI_ENABLED)
    umamiEnabled: process.env.UMAMI_ENABLED === "true",
    umamiHost: process.env.UMAMI_HOST || "",
    umamiWebsiteId: process.env.UMAMI_WEBSITE_ID || "",
    // Firebase
    firebaseApiKey: process.env.FIREBASE_API_KEY || "",
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
    firebaseAppId: process.env.FIREBASE_APP_ID || "",
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    // Google Sign-In (web client ID = "server" client ID for Firebase)
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || "",
  },
});
