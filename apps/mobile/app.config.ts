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
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sneyderangulo.elcambio",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: "com.sneyderangulo.elcambio",
  },
  plugins: ["expo-router"],
  extra: {
    apiBaseUrl: process.env.API_BASE_URL || "",
    // Firebase
    firebaseApiKey: process.env.FIREBASE_API_KEY || "",
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
    firebaseAppId: process.env.FIREBASE_APP_ID || "",
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    // Google OAuth client IDs (for expo-auth-session)
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || "",
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || "",
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || "",
  },
});
