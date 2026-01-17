import { Module } from "@nestjs/common";
import { ExchangeRatesService } from "@/exchange-rates/exchange-rates.service";

@Module({
  providers: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
