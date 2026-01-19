import { Injectable } from "@nestjs/common";

export type UmamiEventData = Record<
  string,
  string | number | boolean | null | undefined
>;

type UmamiSendBody = {
  type: "event";
  payload: {
    website: string;
    hostname: string;
    url: string;
    referrer: string;
    screen: string;
    language: string;
    title: string;
    tag?: string;
    name?: string;
    data?: UmamiEventData;
  };
};

type TrackOptions = {
  /**
   * Override the URL used to attribute the event.
   * Should be a full URL for best compatibility with Umami.
   */
  url?: string;

  /**
   * Override the hostname used to attribute the event.
   */
  hostname?: string;

  /**
   * Override tag (useful to distinguish sources like "api" vs "web").
   */
  tag?: string;
};

function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

@Injectable()
export class UmamiService {
  private readonly enabled: boolean;
  private readonly endpointUrl: string | null;
  private readonly websiteId: string;
  private readonly hostname: string;
  private readonly tag: string;
  private readonly timeoutMs: number;

  constructor() {
    const enabled = process.env.UMAMI_ENABLED === "true";

    const hostUrl = normalizeBaseUrl(process.env.UMAMI_HOST_URL ?? "");
    const websiteId = process.env.UMAMI_WEBSITE_ID ?? "";

    this.websiteId = websiteId;
    this.hostname = (process.env.UMAMI_HOSTNAME || "api").trim();
    this.tag = (process.env.UMAMI_TAG || "api").trim();
    this.timeoutMs = parsePositiveInt(process.env.UMAMI_TIMEOUT_MS) ?? 2_000;

    this.enabled = Boolean(enabled && hostUrl && websiteId);
    this.endpointUrl = this.enabled ? `${hostUrl}/api/send` : null;
  }

  track(eventName: string, data?: UmamiEventData, options?: TrackOptions) {
    if (!this.enabled || !this.endpointUrl) return;

    const hostname = options?.hostname || this.hostname;
    const url =
      options?.url || `https://${hostname.replace(/\/+$/, "")}/internal`;

    const body: UmamiSendBody = {
      type: "event",
      payload: {
        website: this.websiteId,
        hostname,
        url,
        referrer: "",
        screen: "0x0",
        language: "en",
        title: "API",
        tag: options?.tag || this.tag,
        name: eventName,
        data,
      },
    };

    void this.send(body);
  }

  private async send(body: UmamiSendBody): Promise<void> {
    if (!this.endpointUrl) return;

    try {
      await fetch(this.endpointUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      // Fail open: analytics must never break the API.
    }
  }
}
