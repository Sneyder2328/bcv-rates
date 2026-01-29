import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Input,
  Label,
  SectionDivider,
} from "../components/primitives";
import { User, X } from "../icons";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { type ThemeColors, useTheme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export function AuthModal({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Sign In</Text>
        </View>
        <View style={styles.headerRight}>
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            <X size={24} color={colors.textMuted} />
          </Button>
        </View>
      </View>

      <View style={styles.content}>
        <Card>
          <View style={styles.iconContainer}>
            <User size={48} color={colors.primary} />
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Label>Email</Label>
              <Input
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Label>Password</Label>
              <Input placeholder="Enter your password" secureTextEntry />
            </View>

            <Button style={styles.submitButton}>Sign In</Button>
          </View>

          <SectionDivider label="or" />

          {/* TODO(mobile): implement real authentication flow in Phase 3. */}
          <Text style={styles.placeholder}>
            Full authentication will be implemented in Phase 3
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: ThemeColors) =>
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
      alignItems: "center",
      justifyContent: "center",
    },
    headerRight: {
      width: 48,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    form: {
      gap: 16,
    },
    field: {
      gap: 4,
    },
    submitButton: {
      marginTop: 8,
    },
    placeholder: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
