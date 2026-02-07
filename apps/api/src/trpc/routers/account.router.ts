// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { protectedProcedure, router } from "@/trpc/trpc";

export function createAccountRouter(prisma: PrismaService) {
  return router({
    delete: protectedProcedure.mutation(async ({ ctx }) => {
      await prisma.userCustomRate.deleteMany({
        where: { userId: ctx.user.uid },
      });
      return { ok: true };
    }),
  });
}

export type AccountRouter = ReturnType<typeof createAccountRouter>;
