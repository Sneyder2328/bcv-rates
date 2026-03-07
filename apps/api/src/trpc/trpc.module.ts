import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: ConfigService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { ConfigService } from "@nestjs/config";
import * as trpcExpress from "@trpc/server/adapters/express";
import type { NextFunction, Request, Response } from "express";
import { PrismaModule } from "@/prisma/prisma.module";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "@/prisma/prisma.service";
import { createTrpcContext } from "@/trpc/context";
import type { AppRouterConfig } from "@/trpc/routers/app.router";
import { createAppRouter } from "@/trpc/routers/app.router";

function parseMaxPerUser(raw: string | undefined): number {
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

@Module({
  imports: [PrismaModule],
})
export class TrpcModule implements NestModule {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const routerConfig: AppRouterConfig = {
      customRates: {
        maxPerUser: parseMaxPerUser(
          this.configService.get<string>("CUSTOM_RATES_MAX_PER_USER"),
        ),
      },
      exchangeRates: {
        requireServerKeyForGetLatest:
          this.configService.get<string>("GET_LATEST_REQUIRE_SERVER_KEY") ===
          "true",
      },
    };
    const appRouter = createAppRouter(this.prisma, routerConfig);
    const handler = trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: createTrpcContext,
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
