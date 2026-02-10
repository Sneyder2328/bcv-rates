import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CurrencyCode } from "@/generated/prisma/client";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { protectedOrServerProcedure, router } from "@/trpc/trpc";

export function createHistoricalRatesRouter(prisma: PrismaService) {
  return router({
    /**
     * Supports either Firebase-authenticated users or trusted servers.
     * Trusted server access is restricted to USD history.
     */
    getHistory: protectedOrServerProcedure
      .input(
        z.object({
          currency: z.nativeEnum(CurrencyCode),
          limit: z.number().min(1).default(30),
        }),
      )
      .query(async ({ ctx, input }) => {
        const isServerOnlyCaller = !ctx.user && !!ctx.server?.trusted;
        if (isServerOnlyCaller && input.currency !== CurrencyCode.USD) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Trusted server access is limited to USD history.",
          });
        }

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

export type HistoricalRatesRouter = ReturnType<
  typeof createHistoricalRatesRouter
>;
