import { Module } from "@nestjs/common";
import { EarningsCodesController } from "./earnings-codes.controller";
import { EarningsCodesService } from "./earnings-codes.service";

@Module({
  controllers: [EarningsCodesController],
  providers: [EarningsCodesService],
  exports: [EarningsCodesService],
})
export class EarningsCodesModule {}
