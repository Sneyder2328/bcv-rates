import { AuthRequest, makeRedirectUri } from "expo-auth-session";
import { discovery } from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../src/auth";
import { Button, Card, Input, Label } from "../src/components/primitives";
import { ChevronLeft, Eye, EyeOff, Mail, User } from "../src/icons";
import { type ThemeColors, useTheme } from "../src/theme";

// Required so the browser dismisses correctly after OAuth redirect.
WebBrowser.maybeCompleteAuthSession();

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { signInWithGoogle, signInWithEmailPassword, signUpWithEmailPassword } =
    useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const extra = Constants.expoConfig?.extra ?? {};

  // ------------------------------------------------------------------
  // Google sign-in via expo-auth-session
  // ------------------------------------------------------------------
  const handleGoogleSignIn = useCallback(async () => {
    const webClientId = extra.googleWebClientId as string;
    if (!webClientId) {
      Toast.show({
        type: "error",
        text1: "Google Sign-In no configurado",
        text2: "Falta GOOGLE_WEB_CLIENT_ID en las variables de entorno.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const redirectUri = makeRedirectUri({ scheme: "elcambio" });

      const request = new AuthRequest({
        clientId: webClientId,
        redirectUri,
        scopes: ["openid", "profile", "email"],
        responseType: "id_token" as const,
        extraParams: { nonce: Math.random().toString(36).slice(2) },
      });

      const result = await request.promptAsync(discovery);

      if (result.type === "success" && result.params.id_token) {
        await signInWithGoogle(result.params.id_token);
        Toast.show({ type: "success", text1: "Sesión iniciada con Google" });
        router.back();
      } else if (result.type === "cancel") {
        // User cancelled — do nothing.
      } else {
        Toast.show({
          type: "error",
          text1: "Error al iniciar sesión con Google",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setSubmitting(false);
    }
  }, [extra.googleWebClientId, signInWithGoogle, router]);

  // ------------------------------------------------------------------
  // Email / password
  // ------------------------------------------------------------------
  const handleEmailSubmit = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Toast.show({
        type: "error",
        text1: "Completa todos los campos",
      });
      return;
    }

    try {
      setSubmitting(true);
      Keyboard.dismiss();

      if (mode === "login") {
        await signInWithEmailPassword(trimmedEmail, password);
        Toast.show({ type: "success", text1: "Sesión iniciada" });
      } else {
        await signUpWithEmailPassword(trimmedEmail, password);
        Toast.show({ type: "success", text1: "Cuenta creada correctamente" });
      }
      router.back();
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setSubmitting(false);
    }
  }, [
    email,
    password,
    mode,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    router,
  ]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const isLogin = mode === "login";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Button variant="ghost" onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.textMuted} />
          </Button>
        </View>
        <View style={styles.headerCenter}>
          <User size={20} color={colors.primary} />
          <Text style={styles.title}>
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Google sign-in */}
        <Button
          variant="outline"
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={submitting}
        >
          Continuar con Google
        </Button>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.divider }]}
          />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>
            o
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.divider }]}
          />
        </View>

        {/* Email/password form */}
        <Card>
          <View style={styles.formField}>
            <Label>Correo electrónico</Label>
            <View style={styles.inputRow}>
              <View style={styles.inputIconLeft}>
                <Mail size={18} color={colors.textMuted} />
              </View>
              <Input
                style={styles.inputWithIcon}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Label>Contraseña</Label>
            <View style={styles.inputRow}>
              <Input
                style={styles.inputWithToggle}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChangeText={setPassword}
                editable={!submitting}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword((p) => !p)}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </Pressable>
            </View>
          </View>

          <Button
            style={styles.submitButton}
            onPress={handleEmailSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : isLogin ? (
              "Iniciar sesión"
            ) : (
              "Crear cuenta"
            )}
          </Button>

          {/* Mode toggle */}
          <Pressable
            onPress={() => setMode(isLogin ? "signup" : "login")}
            style={styles.toggleRow}
          >
            <Text style={[styles.toggleText, { color: colors.textMuted }]}>
              {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            </Text>
            <Text style={[styles.toggleLink, { color: colors.primary }]}>
              {isLogin ? " Crear cuenta" : " Iniciar sesión"}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Firebase error → human-readable message
// ---------------------------------------------------------------------------

function getFirebaseErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Error desconocido";

  const code = (err as { code?: string }).code;
  switch (code) {
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/user-disabled":
      return "Esta cuenta ha sido deshabilitada.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con este correo.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta de nuevo más tarde.";
    case "auth/network-request-failed":
      return "Error de red. Verifica tu conexión.";
    default:
      return err.message;
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      width: 48,
      justifyContent: "center",
    },
    headerCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    headerRight: {
      width: 48,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    googleButton: {
      marginBottom: 16,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
    },
    dividerText: {
      fontSize: 13,
      fontWeight: "500",
    },
    formField: {
      marginBottom: 12,
    },
    inputRow: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
    },
    inputIconLeft: {
      position: "absolute",
      left: 12,
      zIndex: 1,
    },
    inputWithIcon: {
      flex: 1,
      paddingLeft: 38,
    },
    inputWithToggle: {
      flex: 1,
      paddingRight: 44,
    },
    passwordToggle: {
      position: "absolute",
      right: 12,
      zIndex: 1,
    },
    submitButton: {
      marginTop: 4,
    },
    toggleRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
    },
    toggleText: {
      fontSize: 13,
    },
    toggleLink: {
      fontSize: 13,
      fontWeight: "600",
    },
  });
