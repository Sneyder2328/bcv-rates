import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from "@nestjs/common";
import * as trpcExpress from "@trpc/server/adapters/express";
import type { NextFunction, Request, Response } from "express";
import { AnalyticsModule } from "@/analytics/analytics.module";
// biome-ignore lint/style/useImportType: UmamiService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { UmamiService } from "@/analytics/umami.service";
import { PrismaModule } from "@/prisma/prisma.module";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { createTrpcContext } from "@/trpc/context";
import { createAppRouter } from "@/trpc/routers/app.router";

@Module({
  imports: [PrismaModule, AnalyticsModule],
})
export class TrpcModule implements NestModule {
  constructor(
    private readonly prisma: PrismaService,
    private readonly umami: UmamiService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const appRouter = createAppRouter(this.prisma);
    const handler = trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: (opts) => createTrpcContext(opts, this.umami),
    });

    consumer
      .apply((req: Request, res: Response, next: NextFunction) => {
        // Manually strip the prefix because NestJS middleware forRoutes doesn't do it
        // and tRPC express adapter expects the URL to start with the procedure path
        if (req.url.startsWith("/api/trpc")) {
          req.url = req.url.replace("/api/trpc", "");
          // Ensure it starts with / (e.g. empty string becomes /)
          if (req.url === "") req.url = "/";
        } else if (req.url.startsWith("/trpc")) {
          req.url = req.url.replace("/trpc", "");
          if (req.url === "") req.url = "/";
        }
        handler(req, res, next);
      })
      .forRoutes("trpc");
  }
}
