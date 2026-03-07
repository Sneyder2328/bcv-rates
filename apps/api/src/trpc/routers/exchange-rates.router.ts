import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CurrencyCode } from "@/generated/prisma/client";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { publicProcedure, router } from "@/trpc/trpc";

/**
 * Zod schema for the latest rates response.
 */
const latestRateSchema = z
  .object({
    rate: z.string(),
    validAt: z.string(),
    fetchedAt: z.string(),
    previousRate: z.string().nullable().optional(),
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

        const [usdRates, eurRates] = await Promise.all([
          prisma.exchangeRate.findMany({
            where: { currency: CurrencyCode.USD },
            orderBy: [{ validAt: "desc" }, { fetchedAt: "desc" }],
            take: 2,
          }),
          prisma.exchangeRate.findMany({
            where: { currency: CurrencyCode.EUR },
            orderBy: [{ validAt: "desc" }, { fetchedAt: "desc" }],
            take: 2,
          }),
        ]);

        const usd = usdRates[0];
        const usdPrev = usdRates[1];
        const eur = eurRates[0];
        const eurPrev = eurRates[1];

        return {
          USD: usd
            ? {
                rate: usd.rate.toString(),
                validAt: usd.validAt.toISOString(),
                fetchedAt: usd.fetchedAt.toISOString(),
                previousRate: usdPrev ? usdPrev.rate.toString() : null,
              }
            : null,
          EUR: eur
            ? {
                rate: eur.rate.toString(),
                validAt: eur.validAt.toISOString(),
                fetchedAt: eur.fetchedAt.toISOString(),
                previousRate: eurPrev ? eurPrev.rate.toString() : null,
              }
            : null,
        };
      },
    ),
  });
}

export type ExchangeRatesRouter = ReturnType<typeof createExchangeRatesRouter>;
