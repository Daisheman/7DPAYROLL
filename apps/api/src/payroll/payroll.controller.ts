import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { CreatePayrollRunDto, ReversePayrollRunDto, ToggleDeductionsDto, UpdatePayrollLineDto } from "./dto";
import { PayrollService } from "./payroll.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("payroll/runs")
export class PayrollController {
  constructor(private readonly svc: PayrollService) {}

  @Get()
  list(@Req() req: any) {
    return this.svc.list(req.user.companyId);
  }

  @Get(":id")
  get(@Req() req: any, @Param("id") id: string) {
    return this.svc.get(req.user.companyId, id);
  }

  @Post()
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER", "PAYROLL_PROCESSOR")
  create(@Req() req: any, @Body() dto: CreatePayrollRunDto) {
    return this.svc.create(req.user.companyId, req.user.sub ?? req.user.id, dto);
  }

  @Patch(":id/lines/:lineId")
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER", "PAYROLL_PROCESSOR")
  updateLine(
    @Req() req: any,
    @Param("id") runId: string,
    @Param("lineId") lineId: string,
    @Body() dto: UpdatePayrollLineDto,
  ) {
    return this.svc.updateLine(req.user.companyId, req.user.sub ?? req.user.id, runId, lineId, dto);
  }

  @Post(":id/approve")
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER")
  approve(@Req() req: any, @Param("id") id: string) {
    return this.svc.approve(req.user.companyId, req.user.sub ?? req.user.id, id);
  }

  @Post(":id/lock")
  @Roles("OWNER")
  lock(@Req() req: any, @Param("id") id: string) {
    return this.svc.lock(req.user.companyId, req.user.sub ?? req.user.id, id);
  }

  @Post(":id/toggle-deductions")
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER")
  toggleDeductions(@Req() req: any, @Param("id") id: string, @Body() dto: ToggleDeductionsDto) {
    return this.svc.toggleDeductions(req.user.companyId, req.user.sub ?? req.user.id, id, dto.active);
  }

  // ── Sage Guide Ch. 14: Reverse a payroll run ─────────────────────────────
  @Post(":id/reverse")
  @Roles("OWNER", "ADMIN")
  reverse(@Req() req: any, @Param("id") id: string, @Body() dto: ReversePayrollRunDto) {
    return this.svc.reverse(req.user.companyId, req.user.sub ?? req.user.id, id, dto.reason);
  }

  // ── Sage Guide Ch. 15: Period-end checklist ──────────────────────────────
  @Get(":id/period-end-checklist")
  periodEndChecklist(@Req() req: any, @Param("id") id: string) {
    return this.svc.getPeriodEndChecklist(req.user.companyId, id);
  }

  // ── Sage Guide Ch. 9: Leave accrual summary ──────────────────────────────
  @Get(":id/leave-accrual")
  leaveAccrual(@Req() req: any, @Param("id") id: string) {
    return this.svc.getLeaveAccrualSummary(req.user.companyId, id);
  }

  @Post("calculate")
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER", "PAYROLL_PROCESSOR")
  calculate(@Req() req: any, @Body() dto: CreatePayrollRunDto) {
    return this.svc.create(req.user.companyId, req.user.sub ?? req.user.id, { ...dto });
  }
}
