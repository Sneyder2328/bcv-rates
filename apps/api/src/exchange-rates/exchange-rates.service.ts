import * as https from "node:https";
import { URL } from "node:url";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CurrencyCode, Prisma } from "../../generated/prisma/client";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "../prisma/prisma.service.js";

const BCV_HOMEPAGE_URL = "https://www.bcv.org.ve/";

type LatestRate = {
  rate: Prisma.Decimal;
  validAt: Date;
  fetchedAt: Date;
};

@Injectable()
export class ExchangeRatesService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(private readonly prisma: PrismaService) { }

  onModuleInit() {
    // Don’t block API startup on a remote fetch; just log if this fails.
    this.refreshFromBcv("startup").catch((err) => {
      this.logger.error(
        `BCV refresh failed on startup: ${this.errorToString(err)}`,
        this.errorToStack(err),
      );
    });
  }

  @Cron("5 16,19 * * *", { timeZone: "America/Caracas" })
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
        where: { currency_date: { currency: CurrencyCode.USD, date: validAt } },
        create: { currency: CurrencyCode.USD, date: validAt, rate: usd, fetchedAt },
        update: { rate: usd, fetchedAt },
      }),
      this.prisma.historicalExchangeRate.upsert({
        where: { currency_date: { currency: CurrencyCode.EUR, date: validAt } },
        create: { currency: CurrencyCode.EUR, date: validAt, rate: eur, fetchedAt },
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
    const html = await this.fetchBcvHomepageHtml();

    const validAt = this.extractValidAtFromHtml(html);
    const usd = new Prisma.Decimal(this.extractRateFromHtml(html, "dolar"));
    const eur = new Prisma.Decimal(this.extractRateFromHtml(html, "euro"));

    return { validAt, usd, eur };
  }

  private async fetchBcvHomepageHtml(): Promise<string> {
    const headers: Record<string, string> = {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "es-VE,es;q=0.9,en;q=0.8",
      "user-agent": "bcv-rates/1.0 (+https://github.com/)",
    };

    try {
      const res = await fetch(BCV_HOMEPAGE_URL, { headers });
      if (!res.ok) {
        throw new Error(`BCV request failed: ${res.status} ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      const code = this.errorToCode(err);

      // Node's built-in fetch fails here with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` because
      // BCV's TLS chain isn't always verifiable by Node's default CA set.
      // We fall back to an "insecure" HTTPS request (rejectUnauthorized=false) unless disabled.
      if (this.isTlsVerificationErrorCode(code)) {
        const allowInsecure = process.env.BCV_ALLOW_INSECURE_TLS !== "false";
        if (!allowInsecure) {
          throw new Error(
            `BCV TLS verification failed (${code}). Set BCV_ALLOW_INSECURE_TLS=true to allow insecure fallback.`,
          );
        }

        this.logger.warn(
          `BCV TLS verification failed (${code}); retrying with insecure TLS (BCV_ALLOW_INSECURE_TLS=false to disable).`,
        );

        return await this.httpsGetText(BCV_HOMEPAGE_URL, {
          headers,
          rejectUnauthorized: false,
          maxRedirects: 5,
          timeoutMs: 15_000,
        });
      }

      throw err;
    }
  }

  private httpsGetText(
    url: string,
    opts: {
      headers: Record<string, string>;
      rejectUnauthorized: boolean;
      maxRedirects: number;
      timeoutMs: number;
    },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const u = new URL(url);

      const req = https.request(
        {
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port ? Number(u.port) : undefined,
          path: `${u.pathname}${u.search}`,
          method: "GET",
          headers: {
            ...opts.headers,
            "accept-encoding": "gzip,deflate,br",
          },
          rejectUnauthorized: opts.rejectUnauthorized,
        },
        (res) => {
          const status = res.statusCode ?? 0;
          const location = res.headers.location;

          if (
            status >= 300 &&
            status < 400 &&
            location &&
            opts.maxRedirects > 0
          ) {
            // Consume response before redirecting.
            res.resume();
            const nextUrl = new URL(location, url).toString();
            this.httpsGetText(nextUrl, {
              ...opts,
              maxRedirects: opts.maxRedirects - 1,
            }).then(resolve, reject);
            return;
          }

          if (status < 200 || status >= 300) {
            res.setEncoding("utf8");
            let bodySnippet = "";
            res.on("data", (chunk) => {
              if (bodySnippet.length < 2048) bodySnippet += String(chunk);
            });
            res.on("end", () => {
              reject(
                new Error(
                  `BCV request failed: ${status} ${res.statusMessage ?? ""} ${bodySnippet ? `- ${bodySnippet.slice(0, 200)}` : ""}`,
                ),
              );
            });
            return;
          }

          const encoding = String(
            res.headers["content-encoding"] ?? "",
          ).toLowerCase();

          let stream: NodeJS.ReadableStream = res;
          if (encoding === "gzip") stream = res.pipe(createGunzip());
          else if (encoding === "deflate") stream = res.pipe(createInflate());
          else if (encoding === "br")
            stream = res.pipe(createBrotliDecompress());

          const chunks: Buffer[] = [];
          stream.on("data", (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          stream.on("error", reject);
          stream.on("end", () => {
            resolve(Buffer.concat(chunks).toString("utf8"));
          });
        },
      );

      req.setTimeout(opts.timeoutMs, () => {
        req.destroy(new Error("BCV request timed out"));
      });

      req.on("error", reject);
      req.end();
    });
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
