import { Module } from "@nestjs/common";
import { UmamiService } from "@/analytics/umami.service";

@Module({
  providers: [UmamiService],
  exports: [UmamiService],
})
export class AnalyticsModule {}
