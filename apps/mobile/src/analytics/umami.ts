import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Dimensions, Platform } from "react-native";

export type UmamiEventData = Record<
  string,
  string | number | boolean | null | undefined
>;

type UmamiConfig = {
  enabled: boolean;
  host: string;
  websiteId: string;
  tag: string;
  hostname: string;
};

type UmamiContext = {
  url: string;
  title: string;
  referrer: string;
};

type QueuedEvent = { name: string; data?: UmamiEventData };

const DISTINCT_ID_KEY = "umami.distinctId";

const queue: QueuedEvent[] = [];
const onceKeys = new Set<string>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

let context: UmamiContext = { url: "/", title: "app", referrer: "" };
let distinctId: string | null = null;
let distinctIdPromise: Promise<string | null> | null = null;
let flushPromise: Promise<void> | null = null;

function parseEnabled(raw: unknown): boolean {
  if (raw === true) return true;
  if (raw === false) return false;
  if (typeof raw === "string") return raw.trim().toLowerCase() === "true";
  return false;
}

function getConfig(): UmamiConfig | null {
  const extra = Constants.expoConfig?.extra ?? {};

  const enabled = parseEnabled(
    (extra as { umamiEnabled?: unknown }).umamiEnabled,
  );
  if (!enabled) return null;

  const host = String(
    (extra as { umamiHost?: unknown }).umamiHost ?? "",
  ).trim();
  const websiteId = String(
    (extra as { umamiWebsiteId?: unknown }).umamiWebsiteId ?? "",
  ).trim();

  if (!host || !websiteId) return null;

  const slug = String(Constants.expoConfig?.slug ?? "").trim();

  return {
    enabled,
    host,
    websiteId,
    tag: "mobile",
    hostname: slug || "elcambio",
  };
}

function buildEndpoint(host: string): string {
  const base = host.replace(/\/$/, "");
  return `${base}/api/send`;
}

function getScreenSize(): string {
  const { width, height } = Dimensions.get("screen");
  return `${Math.round(width)}x${Math.round(height)}`;
}

function getLanguage(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (typeof locale === "string" && locale.trim()) return locale;
  } catch {
    // Ignore.
  }
  return "es-VE";
}

function getUserAgent(): string {
  const appName = String(Constants.expoConfig?.name ?? "El Cambio");
  const version = String(Constants.expoConfig?.version ?? "0");
  return `${appName}/${version} (${Platform.OS} ${String(Platform.Version)})`;
}

function createAnonymousId(): string {
  // Not crypto-secure; fine for anonymous analytics identifiers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getDistinctId(): Promise<string | null> {
  if (distinctId) return distinctId;
  if (distinctIdPromise) return distinctIdPromise;

  distinctIdPromise = (async () => {
    try {
      const existing = (await AsyncStorage.getItem(DISTINCT_ID_KEY))?.trim();
      if (existing) {
        distinctId = existing;
        return distinctId;
      }

      const next = createAnonymousId();
      await AsyncStorage.setItem(DISTINCT_ID_KEY, next);
      distinctId = next;
      return distinctId;
    } catch {
      return null;
    } finally {
      distinctIdPromise = null;
    }
  })();

  return distinctIdPromise;
}

async function sendEvent(
  config: UmamiConfig,
  distinctIdValue: string | null,
  event: QueuedEvent,
) {
  const endpoint = buildEndpoint(config.host);

  const payload = {
    hostname: config.hostname,
    language: getLanguage(),
    referrer: context.referrer,
    screen: getScreenSize(),
    title: context.title,
    url: context.url,
    tag: config.tag,
    website: config.websiteId,
    id: distinctIdValue ?? undefined,
    name: event.name,
    data: event.data,
  };

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": getUserAgent(),
      },
      body: JSON.stringify({ type: "event", payload }),
    });
  } catch {
    // Never break UX due to analytics issues.
  }
}

async function flushQueue() {
  const config = getConfig();
  if (!config) {
    queue.length = 0;
    return;
  }

  const id = await getDistinctId();

  // Drain the queue (and keep going if new events are added while flushing).
  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    // Send sequentially to avoid bursts.
    await sendEvent(config, id, next);
  }
}

function scheduleFlush() {
  if (flushPromise) return;

  flushPromise = (async () => {
    try {
      await flushQueue();
    } finally {
      flushPromise = null;
      if (queue.length > 0) scheduleFlush();
    }
  })();
}

export function initUmami() {
  const config = getConfig();
  if (!config) return;
  void getDistinctId();
}

export function setUmamiContext(
  next: Partial<Pick<UmamiContext, "url" | "title">>,
) {
  if (typeof next.url === "string" && next.url.trim()) {
    const url = next.url.trim();
    if (url !== context.url) {
      context = {
        ...context,
        referrer: context.url === "/" ? "" : context.url,
        url,
      };
    }
  }

  if (typeof next.title === "string" && next.title.trim()) {
    context = { ...context, title: next.title.trim() };
  }
}

export function track(name: string, data?: UmamiEventData) {
  if (!getConfig()) return;
  queue.push({ name, data });
  scheduleFlush();
}

export function trackOnce(key: string, name: string, data?: UmamiEventData) {
  if (!getConfig()) return;
  if (onceKeys.has(key)) return;
  onceKeys.add(key);
  track(name, data);
}

export function trackDebounced(
  key: string,
  name: string,
  data: UmamiEventData,
  delayMs = 800,
) {
  if (!getConfig()) return;

  const existing = debounceTimers.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  const timeoutId = setTimeout(() => {
    debounceTimers.delete(key);
    track(name, data);
  }, delayMs);

  debounceTimers.set(key, timeoutId);
}
