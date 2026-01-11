import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: ConfigService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

/**
 * Extended Prisma service with connection pooling and lifecycle management.
 *
 * Features:
 * - Custom pg Pool with configurable timeouts
 * - Automatic connection validation on startup
 * - Graceful shutdown with pool cleanup
 * - Pool statistics for health monitoring
 *
 * Configuration via environment variables:
 * - `DATABASE_URL`: PostgreSQL connection string
 * - `DATABASE_POOL_SIZE`: Max connections (default: 10)
 * - `DATABASE_CONNECTION_TIMEOUT_MS`: Connection timeout (default: 5000ms)
 * - `DATABASE_IDLE_TIMEOUT_MS`: Idle timeout (default: 30000ms)
 *
 * @example
 * ```typescript
 * // Inject and use like standard PrismaClient
 * constructor(private prisma: PrismaService) {}
 *
 * async getUser(id: string) {
 *   return this.prisma.user.findUnique({ where: { id } });
 * }
 *
 * // Get pool stats for monitoring
 * const stats = this.prisma.getPoolStats();
 * ```
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Creates a new PrismaService with connection pooling.
   *
   * @param configService - NestJS ConfigService for reading environment variables
   */
  constructor(configService: ConfigService) {
    const nodeEnv = configService.get<string>("NODE_ENV") || "development";

    const adapter = new PrismaPg({
      connectionString: configService.get<string>("DATABASE_URL"),
      maxConnections: configService.get<number>("DATABASE_POOL_SIZE"),
      minConnections: configService.get<number>("DATABASE_MIN_CONNECTIONS"),
      connectionTimeout: configService.get<number>(
        "DATABASE_CONNECTION_TIMEOUT_MS",
      ),
      idleTimeout: configService.get<number>("DATABASE_IDLE_TIMEOUT_MS"),
    });

    // Configure Prisma logging based on environment
    const logLevels: ("query" | "info" | "warn" | "error")[] =
      nodeEnv === "development" ? ["warn", "error"] : ["error"];

    super({
      adapter,
      log: logLevels,
    });
  }

  /**
   * Initializes database connection on module startup.
   *
   * Connects to the database and validates the connection with a test query.
   * Logs success or failure for monitoring.
   */
  async onModuleInit() {
    this.logger.log("Connecting to database...");

    // Connect to the database to validate the connection as prisma db connections are lazy loaded
    await this.$connect();

    // Validate the connection by running a test query
    await this.$queryRaw`SELECT 1`;

    this.logger.log("Database connection established");
  }

  /**
   * Gracefully closes database connections on module shutdown.
   *
   * Disconnects the Prisma client and ends the pg pool to ensure
   * no connections are left open.
   */
  async onModuleDestroy() {
    this.logger.log("Disconnecting from database...");
    await this.$disconnect();
    this.logger.log("Database connection closed");
  }
}
