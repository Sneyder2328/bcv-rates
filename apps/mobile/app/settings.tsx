import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../src/auth";
import { Banner, Button, Card } from "../src/components/primitives";
import { formatCustomRate, useCustomRates } from "../src/hooks/useCustomRates";
import { useOnlineStatus } from "../src/hooks/useOnlineStatus";
import {
  Check,
  ChevronLeft,
  Pencil,
  Settings,
  Trash2,
  WifiOff,
  X,
} from "../src/icons";
import { type ThemeColors, useTheme } from "../src/theme";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  const {
    items,
    count,
    maxPerUser,
    atLimit,
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useCustomRates();

  // ---- Create form state ----
  const [label, setLabel] = useState("");
  const [rate, setRate] = useState("");

  // ---- Inline-edit state ----
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState("");

  const readOnly = !isOnline;
  const mutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // ---- Handlers ----

  async function handleCreate() {
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Debes iniciar sesión para guardar tasas",
      });
      return;
    }
    if (readOnly) {
      Toast.show({ type: "error", text1: "Sin conexión: modo solo lectura" });
      return;
    }

    try {
      await createMutation.mutateAsync({ label, rate });
      setLabel("");
      setRate("");
      Toast.show({ type: "success", text1: "Tasa guardada" });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo guardar la tasa" });
    }
  }

  async function handleUpdate(id: string) {
    if (readOnly) {
      Toast.show({ type: "error", text1: "Sin conexión: modo solo lectura" });
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, rate: editingRate });
      setEditingId(null);
      setEditingRate("");
      Toast.show({ type: "success", text1: "Tasa actualizada" });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo actualizar la tasa" });
    }
  }

  async function handleDelete(id: string) {
    if (readOnly) {
      Toast.show({ type: "error", text1: "Sin conexión: modo solo lectura" });
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id });
      Toast.show({ type: "success", text1: "Tasa eliminada" });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo eliminar la tasa" });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Button variant="ghost" onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.textMuted} />
          </Button>
        </View>
        <View style={styles.headerCenter}>
          <Settings size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Configuraciones</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Offline banner */}
        {!isOnline && (
          <Banner variant="warning" style={styles.banner}>
            <View style={styles.bannerRow}>
              <WifiOff size={16} color={colors.bannerWarning.text} />
              <Text
                style={[
                  styles.bannerText,
                  { color: colors.bannerWarning.text },
                ]}
              >
                Sin conexión: modo solo lectura
              </Text>
            </View>
          </Banner>
        )}

        {!user ? (
          <Card>
            <Text style={styles.noAuthText}>
              Debes iniciar sesión para administrar tus tasas personalizadas.
            </Text>
          </Card>
        ) : (
          <>
            {/* Section header + count */}
            <View style={styles.countRow}>
              <Text style={styles.sectionTitle}>Tasas Personalizadas</Text>
              <Text style={styles.countText}>
                {count}/{maxPerUser}
              </Text>
            </View>

            {/* ---- Create form ---- */}
            <Card style={styles.card}>
              <View style={styles.createRow}>
                <View style={styles.labelField}>
                  <Text style={styles.fieldLabel}>Label</Text>
                  <TextInput
                    value={label}
                    onChangeText={setLabel}
                    placeholder="USDT"
                    placeholderTextColor={colors.inputPlaceholder}
                    autoCapitalize="characters"
                    maxLength={16}
                    editable={
                      !readOnly && !createMutation.isPending && !atLimit
                    }
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        color: colors.inputText,
                      },
                    ]}
                  />
                </View>
                <View style={styles.rateField}>
                  <Text style={styles.fieldLabel}>Tasa (1 = X Bs)</Text>
                  <TextInput
                    value={rate}
                    onChangeText={setRate}
                    placeholder="0,00"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="decimal-pad"
                    editable={
                      !readOnly && !createMutation.isPending && !atLimit
                    }
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        color: colors.inputText,
                      },
                    ]}
                  />
                </View>
              </View>

              <Button
                onPress={() => void handleCreate()}
                disabled={
                  readOnly ||
                  createMutation.isPending ||
                  !label.trim() ||
                  !rate.trim() ||
                  atLimit
                }
              >
                {readOnly
                  ? "Modo solo lectura"
                  : atLimit
                    ? "Límite alcanzado"
                    : "Guardar tasa"}
              </Button>
            </Card>

            {/* ---- Saved rates list ---- */}
            <Card style={styles.card}>
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Cargando…</Text>
                </View>
              ) : error ? (
                <Text
                  style={[
                    styles.messageText,
                    { color: colors.bannerError.text },
                  ]}
                >
                  Error cargando tasas: {error.message}
                </Text>
              ) : items.length > 0 ? (
                <View style={styles.ratesList}>
                  {items.map((r) => {
                    const formatted = formatCustomRate(r.rate);
                    const isEditing = editingId === r.id;

                    return (
                      <View
                        key={r.id}
                        style={[
                          styles.rateItem,
                          { borderColor: colors.border },
                        ]}
                      >
                        {/* Info column */}
                        <View style={styles.rateItemInfo}>
                          <Text style={styles.rateItemLabel} numberOfLines={1}>
                            {r.label}
                          </Text>
                          {isEditing ? (
                            <TextInput
                              value={editingRate}
                              onChangeText={setEditingRate}
                              placeholder="0,00"
                              placeholderTextColor={colors.inputPlaceholder}
                              keyboardType="decimal-pad"
                              editable={!updateMutation.isPending && !readOnly}
                              autoFocus
                              style={[
                                styles.editInput,
                                {
                                  backgroundColor: colors.inputBackground,
                                  borderColor: colors.inputBorder,
                                  color: colors.inputText,
                                },
                              ]}
                            />
                          ) : (
                            <Text
                              style={styles.rateItemValue}
                              numberOfLines={1}
                            >
                              1 {r.label} = {formatted} Bs
                            </Text>
                          )}
                        </View>

                        {/* Action buttons */}
                        <View style={styles.rateItemActions}>
                          {isEditing ? (
                            <>
                              <Pressable
                                onPress={() => void handleUpdate(r.id)}
                                disabled={
                                  updateMutation.isPending ||
                                  !editingRate.trim() ||
                                  readOnly
                                }
                                style={({ pressed }) => [
                                  styles.actionBtn,
                                  { borderColor: colors.border },
                                  (updateMutation.isPending ||
                                    !editingRate.trim() ||
                                    readOnly) &&
                                    styles.disabledAction,
                                  pressed && styles.pressed,
                                ]}
                              >
                                <Check size={16} color={colors.textSecondary} />
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  setEditingId(null);
                                  setEditingRate("");
                                }}
                                disabled={updateMutation.isPending}
                                style={({ pressed }) => [
                                  styles.actionBtn,
                                  { borderColor: colors.border },
                                  updateMutation.isPending &&
                                    styles.disabledAction,
                                  pressed && styles.pressed,
                                ]}
                              >
                                <X size={16} color={colors.textSecondary} />
                              </Pressable>
                            </>
                          ) : (
                            <Pressable
                              onPress={() => {
                                setEditingId(r.id);
                                setEditingRate(formatted);
                              }}
                              disabled={mutating || readOnly}
                              style={({ pressed }) => [
                                styles.actionBtn,
                                { borderColor: colors.border },
                                (mutating || readOnly) && styles.disabledAction,
                                pressed && styles.pressed,
                              ]}
                            >
                              <Pencil size={16} color={colors.textSecondary} />
                            </Pressable>
                          )}

                          <Pressable
                            onPress={() => void handleDelete(r.id)}
                            disabled={mutating || readOnly}
                            style={({ pressed }) => [
                              styles.actionBtn,
                              { borderColor: colors.border },
                              (mutating || readOnly) && styles.disabledAction,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Trash2 size={16} color={colors.textSecondary} />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.messageText}>
                  Aún no tienes tasas guardadas.
                </Text>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: { flex: 1 },

    // Header
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
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },

    // Scroll content
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },

    // Banner
    banner: {
      marginBottom: 12,
    },
    bannerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    bannerText: {
      fontSize: 13,
      flexShrink: 1,
    },

    // No-auth state
    noAuthText: {
      fontSize: 14,
      color: colors.textMuted,
    },

    // Section header
    countRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    countText: {
      fontSize: 13,
      color: colors.textMuted,
    },

    // Card spacing
    card: {
      marginBottom: 16,
    },

    // Create form
    createRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    labelField: {
      flex: 1,
      gap: 4,
    },
    rateField: {
      flex: 2,
      gap: 4,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: colors.textMuted,
      marginLeft: 4,
    },
    input: {
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      fontSize: 16,
    },

    // List states
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    messageText: {
      fontSize: 14,
      color: colors.textMuted,
    },

    // Rate list
    ratesList: {
      gap: 8,
    },
    rateItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    rateItemInfo: {
      flex: 1,
      minWidth: 0,
    },
    rateItemLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    rateItemValue: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    editInput: {
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 10,
      fontSize: 14,
      marginTop: 4,
    },

    // Action buttons
    rateItemActions: {
      flexDirection: "row",
      gap: 8,
    },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    disabledAction: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.6,
    },
  });
