import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Input, Label } from "../src/components/primitives";
import { ChevronLeft, User } from "../src/icons";
import { type ThemeColors, useTheme } from "../src/theme";

export default function AuthScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);

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
          <Text style={styles.title}>Iniciar sesión</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Google sign-in placeholder */}
        <Button variant="outline" style={styles.googleButton}>
          Continuar con Google
        </Button>

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

        {/* Email/password form placeholder */}
        <Card>
          <View style={styles.formField}>
            <Label>Correo electrónico</Label>
            <Input
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          <View style={styles.formField}>
            <Label>Contraseña</Label>
            <Input placeholder="••••••••" secureTextEntry />
          </View>
          <Button style={styles.submitButton}>Iniciar sesión</Button>
          <Text style={styles.signupHint}>
            Auth functionality coming in Phase 5.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      flex: 1,
      padding: 16,
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
    submitButton: {
      marginTop: 4,
    },
    signupHint: {
      marginTop: 12,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
