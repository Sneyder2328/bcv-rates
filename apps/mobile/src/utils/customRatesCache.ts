import AsyncStorage from "@react-native-async-storage/async-storage";

export type CustomRatesListOutput = {
  maxPerUser: number;
  items: Array<{
    id: string;
    label: string;
    rate: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

type CachedValue<T> = {
  version: 1;
  cachedAt: string;
  data: T;
};

const STORAGE_PREFIX = "bcv-rates:customRates:list:";

export async function readCachedCustomRatesList(
  uid: string,
): Promise<CustomRatesListOutput | null> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${uid}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedValue<CustomRatesListOutput>;
    if (parsed?.version !== 1 || !parsed?.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function writeCachedCustomRatesList(
  uid: string,
  data: CustomRatesListOutput,
): Promise<void> {
  try {
    const value: CachedValue<CustomRatesListOutput> = {
      version: 1,
      cachedAt: new Date().toISOString(),
      data,
    };
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}${uid}`,
      JSON.stringify(value),
    );
  } catch {
    // Silently fail — cache is best-effort
  }
}

export async function clearCachedCustomRatesList(
  uid: string,
): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${STORAGE_PREFIX}${uid}`);
  } catch {
    // Silently fail
  }
}
