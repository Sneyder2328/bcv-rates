export type UmamiEventData = Record<
  string,
  string | number | boolean | null | undefined
>;

type UmamiClient = {
  track: (name: string, data?: UmamiEventData) => void;
  identify?: (id: string, data?: UmamiEventData) => void;
};

declare global {
  interface Window {
    umami?: UmamiClient;
  }
}

type QueuedEvent = { name: string; data?: UmamiEventData };

const queue: QueuedEvent[] = [];
const onceKeys = new Set<string>();
const debounceTimers = new Map<string, number>();

function isEnabled(): boolean {
  return import.meta.env.VITE_UMAMI_ENABLED === "true";
}

function getClient(): UmamiClient | undefined {
  if (typeof window === "undefined") return undefined;
  return window.umami;
}

export function track(name: string, data?: UmamiEventData) {
  if (!isEnabled()) return;

  const client = getClient();
  if (!client) {
    queue.push({ name, data });
    return;
  }

  try {
    client.track(name, data);
  } catch {
    // Never break UX due to analytics issues.
  }
}

export function trackOnce(key: string, name: string, data?: UmamiEventData) {
  if (!isEnabled()) return;
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
  if (!isEnabled()) return;

  const existing = debounceTimers.get(key);
  if (existing !== undefined) {
    window.clearTimeout(existing);
  }

  const timeoutId = window.setTimeout(() => {
    debounceTimers.delete(key);
    track(name, data);
  }, delayMs);

  debounceTimers.set(key, timeoutId);
}

export function flushUmamiQueue() {
  if (!isEnabled()) return;

  const client = getClient();
  if (!client) return;

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    try {
      client.track(next.name, next.data);
    } catch {
      // Swallow; we don't want to loop infinitely.
    }
  }
}
