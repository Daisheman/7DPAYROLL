import { Module } from "@nestjs/common";
import { DeductionCodesController } from "./deduction-codes.controller";
import { DeductionCodesService } from "./deduction-codes.service";

@Module({
  controllers: [DeductionCodesController],
  providers: [DeductionCodesService],
  exports: [DeductionCodesService],
})
export class DeductionCodesModule {}
