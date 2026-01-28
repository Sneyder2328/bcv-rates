import type { NativeStackScreenProps } from "@react-navigation/native-stack";
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

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export function AuthModal({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Sign In</Text>
        </View>
        <View style={styles.headerRight}>
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            <X size={24} color="#6b7280" />
          </Button>
        </View>
      </View>

      <View style={styles.content}>
        <Card>
          <View style={styles.iconContainer}>
            <User size={48} color="#2563eb" />
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

          <Text style={styles.placeholder}>
            Full authentication will be implemented in Phase 3
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    color: "#111827",
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
    color: "#6b7280",
    textAlign: "center",
  },
});
