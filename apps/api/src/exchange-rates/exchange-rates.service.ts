import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Agent } from "undici";
import { CurrencyCode, Prisma } from "@/generated/prisma/client";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";

const BCV_HOMEPAGE_URL = "https://www.bcv.org.ve/";

type LatestRate = {
  rate: Prisma.Decimal;
  validAt: Date;
  fetchedAt: Date;
};

@Injectable()
export class ExchangeRatesService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private readonly BCV_TIMEOUT_MS = 90_000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to determine if we allow insecure TLS based on env vars.
   * Default to TRUE given the target site's known history, but allow override.
   */
  private get allowInsecureTls(): boolean {
    return process.env.BCV_ALLOW_INSECURE_TLS !== "false";
  }

  private get bcvHeaders(): Record<string, string> {
    return {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "es-VE,es;q=0.9,en;q=0.8",
      "user-agent": "bcv-rates/1.0 (+https://github.com/)",
    };
  }

  onModuleInit() {
    // Don't block API startup on a remote fetch; just log if this fails.
    this.refreshFromBcv("startup").catch((err) => {
      this.logger.error(
        `BCV refresh failed on startup: ${this.errorToString(err)}`,
        this.errorToStack(err),
      );
    });
  }

  @Cron("30 17 * * *", { timeZone: "America/Caracas" })
  @Cron("0 19 * * *", { timeZone: "America/Caracas" })
  async refreshFromBcvCron() {
    await this.refreshFromBcv("cron");
  }

  async getLatestRates(): Promise<{
    USD: LatestRate | null;
    EUR: LatestRate | null;
  }> {
    const [usd, eur] = await Promise.all([
      this.prisma.exchangeRate.findFirst({
        where: { currency: CurrencyCode.USD },
        orderBy: [{ validAt: "desc" }, { fetchedAt: "desc" }],
      }),
      this.prisma.exchangeRate.findFirst({
        where: { currency: CurrencyCode.EUR },
        orderBy: [{ validAt: "desc" }, { fetchedAt: "desc" }],
      }),
    ]);

    return {
      USD: usd
        ? {
            rate: usd.rate,
            validAt: usd.validAt,
            fetchedAt: usd.fetchedAt,
          }
        : null,
      EUR: eur
        ? {
            rate: eur.rate,
            validAt: eur.validAt,
            fetchedAt: eur.fetchedAt,
          }
        : null,
    };
  }

  private async refreshFromBcv(trigger: "startup" | "cron") {
    this.logger.log(
      `Refreshing BCV rates (${trigger}) at ${new Date().toISOString()}`,
    );

    const { validAt, usd, eur } = await this.scrapeBcvHomepage();
    const fetchedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.exchangeRate.upsert({
        where: { currency_validAt: { currency: CurrencyCode.USD, validAt } },
        create: { currency: CurrencyCode.USD, validAt, rate: usd, fetchedAt },
        update: { rate: usd, fetchedAt },
      }),
      this.prisma.exchangeRate.upsert({
        where: { currency_validAt: { currency: CurrencyCode.EUR, validAt } },
        create: { currency: CurrencyCode.EUR, validAt, rate: eur, fetchedAt },
        update: { rate: eur, fetchedAt },
      }),
      // Historical Records
      this.prisma.historicalExchangeRate.upsert({
        where: {
          currency_date: { currency: CurrencyCode.USD, date: validAt },
        },
        create: {
          currency: CurrencyCode.USD,
          date: validAt,
          rate: usd,
          fetchedAt,
        },
        update: { rate: usd, fetchedAt },
      }),
      this.prisma.historicalExchangeRate.upsert({
        where: {
          currency_date: { currency: CurrencyCode.EUR, date: validAt },
        },
        create: {
          currency: CurrencyCode.EUR,
          date: validAt,
          rate: eur,
          fetchedAt,
        },
        update: { rate: eur, fetchedAt },
      }),
    ]);

    this.logger.log(
      `Saved BCV rates (${trigger}) for ${validAt.toISOString().slice(0, 10)}: USD=${usd.toString()} EUR=${eur.toString()}`,
    );
  }

  private async scrapeBcvHomepage(): Promise<{
    validAt: Date;
    usd: Prisma.Decimal;
    eur: Prisma.Decimal;
  }> {
    this.logger.log(`Scraping BCV homepage at ${new Date().toISOString()}`);
    const html = await this.fetchBcvHomepageHtml();

    const validAt = this.extractValidAtFromHtml(html);
    const usd = new Prisma.Decimal(this.extractRateFromHtml(html, "dolar"));
    const eur = new Prisma.Decimal(this.extractRateFromHtml(html, "euro"));

    this.logger.log(
      `Scraped BCV homepage: validAt=${validAt.toISOString().slice(0, 10)} USD=${usd.toString()} EUR=${eur.toString()}`,
    );

    return { validAt, usd, eur };
  }

  private async fetchBcvHomepageHtml(): Promise<string> {
    // 1. Setup AbortController for the initial request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.BCV_TIMEOUT_MS);

    try {
      const res = await fetch(BCV_HOMEPAGE_URL, {
        headers: this.bcvHeaders,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`BCV request failed: ${res.status} ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      const code = this.errorToCode(err);

      // Check if it is a TLS error
      if (this.isTlsVerificationErrorCode(code)) {
        if (!this.allowInsecureTls) {
          throw new Error(
            `BCV TLS verification failed (${code}). Set BCV_ALLOW_INSECURE_TLS=true to allow insecure fallback.`,
          );
        }

        this.logger.warn(
          `BCV TLS verification failed (${code}); retrying with insecure TLS.`,
        );

        // 2. Use a custom Dispatcher to ignore SSL errors explicitly for this request
        // This replaces the need for "httpsGetText"
        const insecureAgent = new Agent({
          connect: {
            rejectUnauthorized: false, // The "insecure" magic
            timeout: this.BCV_TIMEOUT_MS,
          },
        });

        return await this.fetchInsecureFallback(
          BCV_HOMEPAGE_URL,
          insecureAgent,
        );
      }

      throw err;
    } finally {
      // Clean up the timeout timer to prevent open handles
      clearTimeout(timeoutId);
    }
  }

  /**
   * Dedicated retry mechanism using the same Fetch API but with a relaxed dispatcher.
   */
  private async fetchInsecureFallback(
    url: string,
    dispatcher: Agent,
  ): Promise<string> {
    const res = await fetch(url, {
      headers: this.bcvHeaders,
      // @ts-expect-error - Node 18+ specific option, dispatcher is not in standard fetch types
      dispatcher: dispatcher,
      signal: AbortSignal.timeout(this.BCV_TIMEOUT_MS), // Simpler timeout for modern Node
    });

    if (!res.ok) {
      throw new Error(
        `BCV Insecure fallback failed: ${res.status} ${res.statusText}`,
      );
    }

    return await res.text();
  }

  private errorToCode(err: unknown): string | undefined {
    const anyErr = err as {
      code?: unknown;
      cause?: { code?: unknown } | undefined;
    };

    const code = anyErr?.cause?.code ?? anyErr?.code;
    return typeof code === "string" ? code : undefined;
  }

  private isTlsVerificationErrorCode(code: string | undefined): boolean {
    return (
      code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
      code === "UNABLE_TO_VERIFY_FIRST_CERTIFICATE" ||
      code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
      code === "SELF_SIGNED_CERT_IN_CHAIN"
    );
  }

  private errorToString(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }

  private errorToStack(err: unknown): string | undefined {
    if (err instanceof Error) return err.stack;
    return undefined;
  }

  private extractValidAtFromHtml(html: string): Date {
    const match = html.match(/Fecha\s+Valor:[\s\S]*?content="([^"]+)"/i);
    const iso = match?.[1]?.trim();
    if (!iso) {
      throw new Error('Could not find "Fecha Valor" in BCV HTML');
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid BCV date: "${iso}"`);
    }

    return date;
  }

  private extractRateFromHtml(html: string, blockId: "dolar" | "euro"): string {
    const match = html.match(
      new RegExp(
        `id="${blockId}"[\\s\\S]*?<strong>\\s*([^<]+?)\\s*<\\/strong>`,
        "i",
      ),
    );
    const raw = match?.[1];
    if (!raw) {
      throw new Error(`Could not find rate for "${blockId}" in BCV HTML`);
    }

    return this.parseBcvNumber(raw);
  }

  /**
   * BCV renders numbers using Spanish formatting (e.g. `330,37510000`).
   * This normalizes the value to a JS/Prisma-friendly decimal string (`330.37510000`).
   */
  private parseBcvNumber(raw: string): string {
    const trimmed = raw.trim();
    const noWhitespace = trimmed.replace(/\s+/g, "");

    // Spanish number formatting: "." thousands separator and "," decimal separator.
    const normalized = noWhitespace.replace(/\./g, "").replace(/,/g, ".");
    const cleaned = normalized.replace(/[^0-9.]/g, "");

    if (!cleaned || Number.isNaN(Number(cleaned))) {
      throw new Error(`Invalid BCV number: "${raw}"`);
    }

    return cleaned;
  }
}
