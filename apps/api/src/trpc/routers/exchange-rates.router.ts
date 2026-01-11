import { z } from "zod";
import { CurrencyCode } from "../../../generated/prisma/client";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "../../prisma/prisma.service.js";
import { publicProcedure, router } from "../trpc.js";

/**
 * Zod schema for the latest rates response.
 */
const latestRateSchema = z
  .object({
    rate: z.string(),
    validAt: z.string(),
    fetchedAt: z.string(),
  })
  .nullable();

const latestRatesResponseSchema = z.object({
  USD: latestRateSchema,
  EUR: latestRateSchema,
});

export type LatestRatesResponse = z.infer<typeof latestRatesResponseSchema>;

/**
 * Factory function to create the exchange rates router.
 * This allows us to inject the PrismaService from NestJS.
 */
export function createExchangeRatesRouter(prisma: PrismaService) {
  return router({
    /**
     * Get the latest exchange rates for USD and EUR.
     */
    getLatest: publicProcedure.query(async (): Promise<LatestRatesResponse> => {
      const [usd, eur] = await Promise.all([
        prisma.exchangeRate.findFirst({
          where: { currency: CurrencyCode.USD },
          orderBy: [{ validAt: "desc" }, { fetchedAt: "desc" }],
        }),
        prisma.exchangeRate.findFirst({
          where: { currency: CurrencyCode.EUR },
          orderBy: [{ validAt: "desc" }, { fetchedAt: "desc" }],
        }),
      ]);

      return {
        USD: usd
          ? {
              rate: usd.rate.toString(),
              validAt: usd.validAt.toISOString(),
              fetchedAt: usd.fetchedAt.toISOString(),
            }
          : null,
        EUR: eur
          ? {
              rate: eur.rate.toString(),
              validAt: eur.validAt.toISOString(),
              fetchedAt: eur.fetchedAt.toISOString(),
            }
          : null,
      };
    }),
  });
}

export type ExchangeRatesRouter = ReturnType<typeof createExchangeRatesRouter>;
