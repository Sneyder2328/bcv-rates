import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from "@nestjs/common";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createAppRouter } from "./routers/app.router.js";
// biome-ignore lint/style/useImportType: PrismaService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { PrismaService } from "../prisma/prisma.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    imports: [PrismaModule],
})
export class TrpcModule implements NestModule {
    constructor(private readonly prisma: PrismaService) { }

    configure(consumer: MiddlewareConsumer) {
        const appRouter = createAppRouter(this.prisma);
        const handler = trpcExpress.createExpressMiddleware({
            router: appRouter,
        });

        consumer
            .apply((req: any, res: any, next: any) => {
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
