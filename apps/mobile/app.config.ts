import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "El Cambio",
  slug: "elcambio",
  version: "1.0.0",
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
    icon: "./assets/icon.png",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    edgeToEdgeEnabled: true,
    package: "com.sneyderangulo.elcambio",
    googleServicesFile: "./google-services.json",
  },
  plugins: ["expo-router", "@react-native-google-signin/google-signin"],
  extra: {
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
