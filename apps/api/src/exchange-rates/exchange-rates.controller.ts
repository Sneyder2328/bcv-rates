import { Controller, Get } from "@nestjs/common";
// biome-ignore lint/style/useImportType: ExchangeRatesService must be a runtime import so NestJS can emit DI metadata for constructor injection.
import { ExchangeRatesService } from "./exchange-rates.service.js";

@Controller("exchange-rates")
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get("latest")
  async getLatest() {
    return this.exchangeRatesService.getLatestRates();
  }
}
