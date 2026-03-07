import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CurrencyCode, type ExchangeRate } from "@/generated/prisma/client";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { publicProcedure, router } from "@/trpc/trpc";

/**
 * Zod schema for the latest rates response.
 */
const rateSnapshotSchema = z.object({
  rate: z.string(),
  validAt: z.string(),
  fetchedAt: z.string(),
});

const latestRateSchema = z
  .object({
    rate: z.string(),
    validAt: z.string(),
    fetchedAt: z.string(),
    previousRate: z.string().nullable().optional(),
    nextPublished: rateSnapshotSchema.nullable().optional(),
  })
  .nullable();

const latestRatesResponseSchema = z.object({
  USD: latestRateSchema,
  EUR: latestRateSchema,
});

export type LatestRatesResponse = z.infer<typeof latestRatesResponseSchema>;

export type ExchangeRatesRouterConfig = {
  requireServerKeyForGetLatest: boolean;
};

const CARACAS_TIME_ZONE = "America/Caracas";
const CARACAS_UTC_OFFSET = "-04:00";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Could not derive date parts for time zone "${timeZone}".`);
  }

  return { year, month, day };
}

function getEndOfTodayInCaracas(now: Date = new Date()): Date {
  const { year, month, day } = getDatePartsInTimeZone(now, CARACAS_TIME_ZONE);
  const startOfToday = new Date(
    `${year}-${month}-${day}T00:00:00.000${CARACAS_UTC_OFFSET}`,
  );

  return new Date(startOfToday.getTime() + ONE_DAY_MS - 1);
}

function toRateSnapshot(record: ExchangeRate) {
  return {
    rate: record.rate.toString(),
    validAt: record.validAt.toISOString(),
    fetchedAt: record.fetchedAt.toISOString(),
  };
}

function buildLatestRate(
  activeRates: ExchangeRate[],
  nextPublished: ExchangeRate | null,
) {
  const current = activeRates[0];
  const previous = activeRates[1];

  if (!current) {
    return null;
  }

  return {
    ...toRateSnapshot(current),
    previousRate: previous ? previous.rate.toString() : null,
    nextPublished: nextPublished ? toRateSnapshot(nextPublished) : null,
  };
}

/**
 * Factory function to create the exchange rates router.
 * This allows us to inject the PrismaService from NestJS.
 */
export function createExchangeRatesRouter(
  prisma: PrismaService,
  config: ExchangeRatesRouterConfig,
) {
  return router({
    /**
     * Get the latest exchange rates for USD and EUR.
     * During rollout this endpoint stays public unless
     * requireServerKeyForGetLatest is true.
     */
    getLatest: publicProcedure.query(
      async ({ ctx }): Promise<LatestRatesResponse> => {
        if (config.requireServerKeyForGetLatest && !ctx.server?.trusted) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Trusted server key is required for getLatest.",
          });
        }

        const activeCutoff = getEndOfTodayInCaracas();

        const [usdRates, eurRates, usdNextPublished, eurNextPublished] =
          await Promise.all([
            prisma.exchangeRate.findMany({
              where: {
                currency: CurrencyCode.USD,
                validAt: { lte: activeCutoff },
              },
              orderBy: [{ validAt: "desc" }, { fetchedAt: "desc" }],
              take: 2,
            }),
            prisma.exchangeRate.findMany({
              where: {
                currency: CurrencyCode.EUR,
                validAt: { lte: activeCutoff },
              },
              orderBy: [{ validAt: "desc" }, { fetchedAt: "desc" }],
              take: 2,
            }),
            prisma.exchangeRate.findFirst({
              where: {
                currency: CurrencyCode.USD,
                validAt: { gt: activeCutoff },
              },
              orderBy: [{ validAt: "asc" }, { fetchedAt: "desc" }],
            }),
            prisma.exchangeRate.findFirst({
              where: {
                currency: CurrencyCode.EUR,
                validAt: { gt: activeCutoff },
              },
              orderBy: [{ validAt: "asc" }, { fetchedAt: "desc" }],
            }),
          ]);

        return {
          USD: buildLatestRate(usdRates, usdNextPublished),
          EUR: buildLatestRate(eurRates, eurNextPublished),
        };
      },
    ),
  });
}

export type ExchangeRatesRouter = ReturnType<typeof createExchangeRatesRouter>;
