import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = value ? parseDatePart(value) : undefined;
  const maxDate = max ? parseDatePart(max) : undefined;
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    selectedDate ?? maxDate ?? new Date(),
  );

  useEffect(() => {
    if (isOpen) return;
    setVisibleMonth(selectedDate ?? maxDate ?? new Date());
  }, [isOpen, maxDate, selectedDate]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const canGoPrev = Boolean(value) && !disabled;
  const canGoNext = Boolean(value) && !disabled && (!max || value < max);

  function handleChange(nextDate: string) {
    if (!nextDate) return;

    if (max && nextDate > max) {
      onChange(max);
      setIsOpen(false);
      return;
    }

    onChange(nextDate);
    setIsOpen(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Otra fecha
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Opcional. Cambia la fecha de calculo si quieres comparar otra tasa.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2" ref={containerRef}>
        <button
          type="button"
          onClick={() => value && handleChange(shiftDatePart(value, -1))}
          disabled={!canGoPrev}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/40 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Ir al dia anterior"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              setVisibleMonth(selectedDate ?? maxDate ?? new Date());
              setIsOpen((current) => !current);
            }}
            disabled={disabled}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 text-left text-zinc-100 transition hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <CalendarDays
                size={16}
                className="text-zinc-500"
                aria-hidden="true"
              />
              {value ? formatDisplayDate(value) : "Selecciona una fecha"}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              calendario
            </span>
          </button>

          {isOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-[320px] max-w-[calc(100vw-3rem)] rounded-2xl border border-zinc-800/80 bg-[#09090d]/96 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <DayPicker
                mode="single"
                month={visibleMonth}
                onMonthChange={setVisibleMonth}
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) return;
                  handleChange(formatDatePart(date));
                }}
                locale={es}
                showOutsideDays
                disabled={maxDate ? { after: maxDate } : undefined}
                endMonth={maxDate}
                className="mx-auto"
                classNames={{
                  root: "w-full",
                  months: "w-full",
                  month: "space-y-3",
                  month_caption:
                    "relative flex items-center justify-center px-8 pb-1",
                  caption_label:
                    "text-sm font-semibold uppercase tracking-[0.2em] text-zinc-200",
                  nav: "absolute inset-x-0 top-0 flex items-center justify-between",
                  button_previous:
                    "flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100",
                  button_next:
                    "flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100",
                  chevron: "h-4 w-4 fill-none stroke-current stroke-2",
                  month_grid: "w-full border-collapse",
                  weekdays: "grid grid-cols-7 gap-1",
                  weekday:
                    "rounded-md py-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600",
                  weeks: "mt-2 space-y-1",
                  week: "grid grid-cols-7 gap-1",
                  day: "flex items-center justify-center",
                  day_button:
                    "flex h-10 w-10 items-center justify-center rounded-xl text-sm text-zinc-300 transition hover:bg-zinc-800/80 hover:text-white",
                  selected:
                    "bg-gradient-to-br from-amber-400 to-orange-500 text-black hover:bg-gradient-to-br hover:from-amber-400 hover:to-orange-500 hover:text-black",
                  today:
                    "ring-1 ring-emerald-500/60 text-emerald-300 hover:text-emerald-200",
                  outside: "text-zinc-700",
                  disabled: "pointer-events-none opacity-30",
                }}
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => value && handleChange(shiftDatePart(value, 1))}
          disabled={!canGoNext}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/40 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Ir al dia siguiente"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
