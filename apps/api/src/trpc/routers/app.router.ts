// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { createAccountRouter } from "@/trpc/routers/account.router";
import type { CustomRatesRouterConfig } from "@/trpc/routers/custom-rates.router";
import { createCustomRatesRouter } from "@/trpc/routers/custom-rates.router";
import type { ExchangeRatesRouterConfig } from "@/trpc/routers/exchange-rates.router";
import { createExchangeRatesRouter } from "@/trpc/routers/exchange-rates.router";
import { createHistoricalRatesRouter } from "@/trpc/routers/historical-rates.router";
import { router } from "@/trpc/trpc";

export type AppRouterConfig = {
  customRates: CustomRatesRouterConfig;
  exchangeRates: ExchangeRatesRouterConfig;
};

/**
 * Factory function to create the main app router.
 * This merges all sub-routers into a single tRPC router.
 */
export function createAppRouter(
  prisma: PrismaService,
  config: AppRouterConfig,
) {
  return router({
    account: createAccountRouter(prisma),
    customRates: createCustomRatesRouter(prisma, config.customRates),
    exchangeRates: createExchangeRatesRouter(prisma, config.exchangeRates),
    historicalRates: createHistoricalRatesRouter(prisma),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
