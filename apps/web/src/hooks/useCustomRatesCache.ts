import { useEffect, useRef } from "react";
import { trpc } from "@/trpc/client";
import {
  readCachedCustomRatesList,
  writeCachedCustomRatesList,
} from "@/utils/customRatesCache";
import { useOnlineStatus } from "@/utils/network";

export function useCustomRatesCache(userId: string | undefined) {
  const isOnline = useOnlineStatus();
  const utils = trpc.useUtils();

  const prevUserUidRef = useRef<string | null>(null);

  // Reset custom rates query when user changes
  useEffect(() => {
    const nextUid = userId ?? null;
    if (prevUserUidRef.current !== nextUid) {
      utils.customRates.list.reset();
      prevUserUidRef.current = nextUid;
    }
  }, [userId, utils]);

  const customRatesQuery = trpc.customRates.list.useQuery(undefined, {
    enabled: !!userId && isOnline,
  });

  // Write to cache when data is fetched
  useEffect(() => {
    if (!userId) return;
    if (!customRatesQuery.data) return;
    writeCachedCustomRatesList(userId, customRatesQuery.data);
  }, [customRatesQuery.data, userId]);

  // Read from cache when no data is available
  useEffect(() => {
    if (!userId) return;
    if (customRatesQuery.data) return;
    const cached = readCachedCustomRatesList(userId);
    if (!cached) return;
    utils.customRates.list.setData(undefined, cached);
  }, [customRatesQuery.data, userId, utils]);

  return customRatesQuery;
}
