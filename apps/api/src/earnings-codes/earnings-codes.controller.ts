import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { EarningsCodesService } from "./earnings-codes.service";

@ApiTags("Earnings Codes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("earnings-codes")
export class EarningsCodesController {
  constructor(private readonly svc: EarningsCodesService) {}

  @Get()
  list(@Req() req: any) {
    return this.svc.list(req.user.companyId);
  }

  @Post()
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER")
  create(@Req() req: any, @Body() body: any) {
    return this.svc.create(req.user.companyId, body);
  }

  @Patch(":id")
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER")
  update(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.svc.update(req.user.companyId, id, body);
  }

  @Delete(":id")
  @Roles("OWNER", "ADMIN")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.svc.remove(req.user.companyId, id);
  }
}
