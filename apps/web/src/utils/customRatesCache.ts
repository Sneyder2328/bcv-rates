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

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readCachedCustomRatesList(
  uid: string,
): CustomRatesListOutput | null {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(`${STORAGE_PREFIX}${uid}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedValue<CustomRatesListOutput>;
    if (parsed?.version !== 1 || !parsed?.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCachedCustomRatesList(
  uid: string,
  data: CustomRatesListOutput,
) {
  const storage = getStorage();
  if (!storage) return;

  const value: CachedValue<CustomRatesListOutput> = {
    version: 1,
    cachedAt: new Date().toISOString(),
    data,
  };

  storage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(value));
}
