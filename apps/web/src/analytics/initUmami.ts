import { flushUmamiQueue } from "./umami.ts";

type UmamiInitConfig = {
  enabled: boolean;
  hostUrl: string;
  websiteId: string;
  scriptName: string;
  tag: string;
};

const UMAMI_SCRIPT_ATTR = "data-umami-script";

function getConfig(): UmamiInitConfig {
  const enabled = import.meta.env.VITE_UMAMI_ENABLED === "true";

  const hostUrlRaw = import.meta.env.VITE_UMAMI_HOST_URL;
  const websiteIdRaw = import.meta.env.VITE_UMAMI_WEBSITE_ID;

  return {
    enabled,
    hostUrl: (hostUrlRaw || "").trim(),
    websiteId: (websiteIdRaw || "").trim(),
    scriptName: "script.js",
    tag: "web",
  };
}

function buildScriptSrc(hostUrl: string, scriptName: string): string {
  const base = hostUrl.replace(/\/$/, "");
  const name = scriptName.replace(/^\//, "");
  return `${base}/${name}`;
}

export function initUmami() {
  const config = getConfig();
  if (!config.enabled) return;

  if (!config.hostUrl || !config.websiteId) return;

  if (typeof document === "undefined") return;

  // If the tracker is already loaded (e.g. injected elsewhere), just flush any queued events.
  if (typeof window !== "undefined" && window.umami) {
    flushUmamiQueue();
    return;
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[${UMAMI_SCRIPT_ATTR}="true"], script[data-website-id="${config.websiteId}"]`,
  );
  if (existing) {
    existing.addEventListener("load", flushUmamiQueue, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = buildScriptSrc(config.hostUrl, config.scriptName);
  script.setAttribute(UMAMI_SCRIPT_ATTR, "true");
  script.addEventListener("load", flushUmamiQueue, { once: true });

  // Umami standard attributes.
  script.dataset.websiteId = config.websiteId;
  script.dataset.hostUrl = config.hostUrl;
  script.dataset.tag = config.tag;

  // Privacy / hygiene.
  script.dataset.doNotTrack = "true";
  script.dataset.excludeSearch = "true";
  script.dataset.excludeHash = "true";

  document.head.appendChild(script);
}
