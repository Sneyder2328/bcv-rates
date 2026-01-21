import { z } from "zod";
import { CurrencyCode } from "@/generated/prisma/client";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { protectedProcedure, router } from "@/trpc/trpc";

export function createHistoricalRatesRouter(prisma: PrismaService) {
    return router({
        getHistory: protectedProcedure
            .input(
                z.object({
                    currency: z.nativeEnum(CurrencyCode),
                    limit: z.number().min(1).default(30),
                }),
            )
            .query(async ({ input }) => {
                const history = await prisma.historicalExchangeRate.findMany({
                    where: { currency: input.currency },
                    orderBy: { date: "desc" },
                    take: input.limit,
                });

                return history.map((record) => ({
                    date: record.date.toISOString(),
                    rate: record.rate.toString(),
                }));
            }),
    });
}

export type HistoricalRatesRouter = ReturnType<typeof createHistoricalRatesRouter>;
