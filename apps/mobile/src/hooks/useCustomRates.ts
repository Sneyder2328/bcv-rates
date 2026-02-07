import { formatRate } from "@bcv-rates/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth";
import { getTrpcClient } from "../lib/trpcClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomRate {
  id: string;
  label: string;
  rate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomRatesListData {
  maxPerUser: number;
  items: CustomRate[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const QUERY_KEY = ["customRates", "list"];

export function formatCustomRate(rateStr: string): string {
  const n = Number(rateStr);
  return Number.isFinite(n) ? formatRate(n) : rateStr;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCustomRates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getTrpcClient().customRates.list.query(),
    enabled: !!user,
    meta: { persist: true },
  });

  const createMutation = useMutation({
    mutationFn: (input: { label: string; rate: string }) =>
      getTrpcClient().customRates.create.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; label?: string; rate?: string }) =>
      getTrpcClient().customRates.update.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { id: string }) =>
      getTrpcClient().customRates.delete.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const maxPerUser = listQuery.data?.maxPerUser ?? 10;
  const items = listQuery.data?.items ?? [];
  const atLimit = items.length >= maxPerUser;

  return {
    items,
    maxPerUser,
    atLimit,
    count: items.length,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
