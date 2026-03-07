import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight } from "../icons";
import { type ThemeColors, useTheme } from "../theme";
import { Button } from "./primitives";

type RateDateSelectorProps = {
  value?: string | null;
  max?: string;
  disabled?: boolean;
  onChange: (nextDate: string) => void;
};

function parseDatePart(datePart: string): Date {
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDatePart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(datePart: string): string {
  return parseDatePart(datePart).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function shiftDatePart(datePart: string, deltaDays: number): string {
  const nextDate = parseDatePart(datePart);
  nextDate.setDate(nextDate.getDate() + deltaDays);
  return formatDatePart(nextDate);
}

export function RateDateSelector({
  value,
  max,
  disabled,
  onChange,
}: RateDateSelectorProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const selectedDate = value ? parseDatePart(value) : undefined;
  const maxDate = max ? parseDatePart(max) : undefined;
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState<Date>(
    selectedDate ?? maxDate ?? new Date(),
  );

  useEffect(() => {
    if (iosModalOpen) return;
    setIosDraftDate(selectedDate ?? maxDate ?? new Date());
  }, [iosModalOpen, maxDate, selectedDate]);

  const currentValue = typeof value === "string" && value ? value : null;
  const canGoPrev = Boolean(currentValue) && !disabled;
  const canGoNext =
    Boolean(currentValue) &&
    !disabled &&
    (!max || (currentValue !== null && currentValue < max));

  function commitDate(date: Date) {
    const nextDate = formatDatePart(date);

    if (max && nextDate > max) {
      onChange(max);
      return;
    }

    onChange(nextDate);
  }

  function handleAndroidChange(event: DateTimePickerEvent, nextDate?: Date) {
    if (event.type !== "set" || !nextDate) return;
    commitDate(nextDate);
  }

  function openNativePicker() {
    if (disabled) return;

    const baseDate = selectedDate ?? maxDate ?? new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: "date",
        display: "calendar",
        maximumDate: maxDate,
        onChange: handleAndroidChange,
      });
      return;
    }

    setIosDraftDate(baseDate);
    setIosModalOpen(true);
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>Otra fecha</Text>
        <Text style={styles.helper}>
          Opcional. Cambia la fecha de calculo si quieres comparar otra tasa.
        </Text>

        <View style={styles.controlsRow}>
          <Pressable
            onPress={() =>
              currentValue &&
              commitDate(parseDatePart(shiftDatePart(currentValue, -1)))
            }
            disabled={!canGoPrev}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && canGoPrev && styles.pressed,
              !canGoPrev && styles.disabled,
            ]}
          >
            <ChevronLeft size={18} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={openNativePicker}
            disabled={disabled}
            style={({ pressed }) => [
              styles.dateButton,
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <View style={styles.dateButtonContent}>
              <CalendarDays size={16} color={colors.textMuted} />
              <Text style={styles.dateText}>
                {currentValue
                  ? formatDisplayDate(currentValue)
                  : "Selecciona una fecha"}
              </Text>
            </View>
            <Text style={styles.dateButtonHint}>Calendario</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              currentValue &&
              commitDate(parseDatePart(shiftDatePart(currentValue, 1)))
            }
            disabled={!canGoNext}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && canGoNext && styles.pressed,
              !canGoNext && styles.disabled,
            ]}
          >
            <ChevronRight size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {Platform.OS === "ios" ? (
        <Modal
          visible={iosModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setIosModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Selecciona una fecha</Text>
              <Text style={styles.modalSubtitle}>
                La tasa aplicada se resolvera segun la fecha valor elegida.
              </Text>

              <DateTimePicker
                value={iosDraftDate}
                mode="date"
                display="inline"
                maximumDate={maxDate}
                onChange={(_event, nextDate) => {
                  if (!nextDate) return;
                  setIosDraftDate(nextDate);
                }}
                locale="es-VE"
                themeVariant={isDark ? "dark" : "light"}
              />

              <View style={styles.modalActions}>
                <Button
                  variant="ghost"
                  onPress={() => {
                    setIosDraftDate(selectedDate ?? maxDate ?? new Date());
                    setIosModalOpen(false);
                  }}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button
                  onPress={() => {
                    commitDate(iosDraftDate);
                    setIosModalOpen(false);
                  }}
                  style={styles.modalButton}
                >
                  Aplicar
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textMuted,
    },
    helper: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
    },
    controlsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    dateButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    dateButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    dateText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flexShrink: 1,
    },
    dateButtonHint: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textMuted,
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.7,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      padding: 16,
      gap: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 4,
    },
    modalButton: {
      minWidth: 96,
    },
  });
