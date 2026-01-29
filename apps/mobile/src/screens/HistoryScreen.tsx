import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card } from "../components/primitives";
import { ArrowLeft, History } from "../icons";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { type ThemeColors, useTheme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

export function HistoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.textMuted} />
          </Button>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Rate History</Text>
        </View>
        <View style={styles.headerRight}>
          <History size={24} color={colors.primary} />
        </View>
      </View>

      <View style={styles.content}>
        <Card>
          <Text style={styles.cardTitle}>Historical Rates</Text>
          <Text style={styles.placeholder}>
            Chart and historical data will be implemented in Phase 3
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
    cardTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    placeholder: {
      fontSize: 14,
      color: colors.textMuted,
    },
  });
