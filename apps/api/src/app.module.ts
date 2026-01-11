import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ExchangeRatesModule } from "./exchange-rates/exchange-rates.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { TrpcModule } from "./trpc/trpc.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ScheduleModule.forRoot(),
    ExchangeRatesModule,
    TrpcModule,
  ],
})
export class AppModule {}
