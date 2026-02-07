import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey as string | undefined,
  authDomain: extra.firebaseAuthDomain as string | undefined,
  projectId: extra.firebaseProjectId as string | undefined,
  appId: extra.firebaseAppId as string | undefined,
  messagingSenderId: extra.firebaseMessagingSenderId as string | undefined,
  storageBucket: extra.firebaseStorageBucket as string | undefined,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Use initializeAuth with AsyncStorage persistence so auth state survives
// app restarts. Wrap in try/catch for hot-reload safety (initializeAuth
// throws if called twice on the same app instance).
let auth: ReturnType<typeof initializeAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Auth already initialized (e.g. during hot reload).
  auth = getAuth(app) as ReturnType<typeof initializeAuth>;
}

export { auth };
export const googleProvider = new GoogleAuthProvider();
