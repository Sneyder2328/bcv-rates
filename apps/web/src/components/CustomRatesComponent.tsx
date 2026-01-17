import { CustomRatesHeader } from "@/components/CustomRatesHeader";
import { CustomRatesList } from "@/components/CustomRatesList";

interface CustomRate {
  id: string;
  label: string;
  rate: string;
}

interface CustomRatesQuery {
  isLoading: boolean;
  error: { message: string } | null;
  data: { items: CustomRate[] } | null | undefined;
}

interface CustomRatesComponentProps {
  customRatesQuery: CustomRatesQuery;
  customUnitLabel: string;
  onRateSelect: (label: string, formattedRate: string) => void;
}

export function CustomRatesComponent({
  customRatesQuery,
  customUnitLabel,
  onRateSelect,
}: CustomRatesComponentProps) {
  return (
    <div className="space-y-1 sm:space-y-2">
      <CustomRatesHeader count={customRatesQuery.data?.items.length} />

      <CustomRatesList
        customRatesQuery={customRatesQuery}
        customUnitLabel={customUnitLabel}
        onRateSelect={onRateSelect}
      />
    </div>
  );
}
