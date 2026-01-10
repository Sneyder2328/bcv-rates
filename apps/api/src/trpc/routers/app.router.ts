import { router } from "../trpc.js";
import {
    createExchangeRatesRouter,
    type ExchangeRatesRouter,
} from "./exchange-rates.router.js";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "../../prisma/prisma.service.js";

/**
 * Factory function to create the main app router.
 * This merges all sub-routers into a single tRPC router.
 */
export function createAppRouter(prisma: PrismaService) {
    return router({
        exchangeRates: createExchangeRatesRouter(prisma),
    });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
