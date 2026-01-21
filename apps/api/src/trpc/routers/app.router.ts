// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { createCustomRatesRouter } from "@/trpc/routers/custom-rates.router";
import { createExchangeRatesRouter } from "@/trpc/routers/exchange-rates.router";
import { createHistoricalRatesRouter } from "@/trpc/routers/historical-rates.router";
import { router } from "@/trpc/trpc";

/**
 * Factory function to create the main app router.
 * This merges all sub-routers into a single tRPC router.
 */
export function createAppRouter(prisma: PrismaService) {
  return router({
    customRates: createCustomRatesRouter(prisma),
    exchangeRates: createExchangeRatesRouter(prisma),
    historicalRates: createHistoricalRatesRouter(prisma),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
