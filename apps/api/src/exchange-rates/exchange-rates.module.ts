import { Module } from "@nestjs/common";
import { AnalyticsModule } from "@/analytics/analytics.module";
import { ExchangeRatesService } from "@/exchange-rates/exchange-rates.service";

@Module({
  imports: [AnalyticsModule],
  providers: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
