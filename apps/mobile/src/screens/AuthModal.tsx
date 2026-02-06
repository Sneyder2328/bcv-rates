import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  Button,
  Card,
  Input,
  Label,
  SectionDivider,
} from "../components/primitives";
import { User, X } from "../icons";
import { getAuthErrorMessage } from "../lib/authErrors";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../providers/AuthProvider";
import { type ThemeColors, useTheme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;
type AuthMode = "login" | "signup";

export function AuthModal({ navigation }: Props) {
  const { signInWithGoogle, signInWithEmailPassword, signUpWithEmailPassword } =
    useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = mode === "login" ? "Iniciar sesión" : "Crear cuenta";
  const canSubmitEmail = email.trim().length > 0 && password.length > 0;

  async function handleEmailPasswordSubmit() {
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithEmailPassword(email.trim(), password);
      } else {
        await signUpWithEmailPassword(email.trim(), password);
      }
      Toast.show({ type: "success", text1: "Sesión iniciada" });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: "error", text1: getAuthErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      Toast.show({ type: "success", text1: "Sesión iniciada" });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: "error", text1: getAuthErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            Guarda tasas personalizadas por usuario
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            <X size={24} color={colors.textMuted} />
          </Button>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <User size={48} color={colors.primary} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              onPress={() => void handleGoogle()}
              disabled={submitting}
              style={[
                styles.googleButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.inputBackground,
                },
                submitting && styles.disabledButton,
              ]}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator
                  size="small"
                  color={colors.text}
                  style={styles.buttonSpinner}
                />
              ) : null}
              <Text style={[styles.googleButtonText, { color: colors.text }]}>
                Continuar con Google
              </Text>
            </TouchableOpacity>

            <SectionDivider label="o con email" />

            {/* Email / password form */}
            <View style={styles.form}>
              <View style={styles.field}>
                <Label>Email</Label>
                <Input
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={mode === "login" ? "email" : "email"}
                  value={email}
                  onChangeText={setEmail}
                  editable={!submitting}
                />
              </View>

              <View style={styles.field}>
                <Label>Contraseña</Label>
                <Input
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChangeText={setPassword}
                  editable={!submitting}
                  onSubmitEditing={
                    canSubmitEmail
                      ? () => void handleEmailPasswordSubmit()
                      : undefined
                  }
                  returnKeyType="go"
                />
              </View>

              <Button
                onPress={() => void handleEmailPasswordSubmit()}
                disabled={submitting || !canSubmitEmail}
                style={styles.submitButton}
              >
                {submitting ? (
                  <View style={styles.buttonRow}>
                    <ActivityIndicator
                      size="small"
                      color={colors.primaryText}
                      style={styles.buttonSpinner}
                    />
                    <Text
                      style={[
                        styles.submitButtonText,
                        { color: colors.primaryText },
                      ]}
                    >
                      {mode === "login" ? "Ingresando…" : "Creando cuenta…"}
                    </Text>
                  </View>
                ) : mode === "login" ? (
                  "Iniciar sesión"
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </View>

            {/* Toggle login / signup */}
            <View style={styles.modeToggle}>
              {mode === "login" ? (
                <Text style={[styles.modeText, { color: colors.textMuted }]}>
                  ¿No tienes cuenta?{" "}
                  <Text
                    style={[styles.modeLink, { color: colors.primary }]}
                    onPress={() => setMode("signup")}
                  >
                    Crear cuenta
                  </Text>
                </Text>
              ) : (
                <Text style={[styles.modeText, { color: colors.textMuted }]}>
                  ¿Ya tienes cuenta?{" "}
                  <Text
                    style={[styles.modeLink, { color: colors.primary }]}
                    onPress={() => setMode("login")}
                  >
                    Iniciar sesión
                  </Text>
                </Text>
              )}
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      alignItems: "center",
      justifyContent: "center",
    },
    headerRight: {
      width: 48,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      paddingVertical: 24,
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 1,
    },
    googleButtonText: {
      fontSize: 15,
      fontWeight: "600",
    },
    disabledButton: {
      opacity: 0.5,
    },
    form: {
      gap: 16,
    },
    field: {
      gap: 4,
    },
    submitButton: {
      marginTop: 4,
      borderRadius: 12,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    buttonRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    buttonSpinner: {
      marginRight: 8,
    },
    modeToggle: {
      marginTop: 20,
      alignItems: "center",
    },
    modeText: {
      fontSize: 14,
    },
    modeLink: {
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  });
