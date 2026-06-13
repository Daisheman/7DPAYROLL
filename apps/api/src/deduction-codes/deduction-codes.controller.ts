import { Body, Controller, Delete, Get, Param, Post, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { DeductionCodesService } from "./deduction-codes.service";

@ApiTags("Deduction Codes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("deduction-codes")
export class DeductionCodesController {
  constructor(private readonly svc: DeductionCodesService) {}

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

  // Employee deduction assignments
  @Get("assignments")
  listAssignments(@Req() req: any, @Query("employeeId") employeeId?: string) {
    return this.svc.listEmployeeDeductions(req.user.companyId, employeeId);
  }

  @Post("assignments")
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER", "HR_MANAGER")
  assign(@Req() req: any, @Body() body: any) {
    return this.svc.assignToEmployee(req.user.companyId, body);
  }

  @Delete("assignments/:id")
  @Roles("OWNER", "ADMIN", "PAYROLL_MANAGER")
  removeAssignment(@Req() req: any, @Param("id") id: string) {
    return this.svc.deactivateAssignment(req.user.companyId, id);
  }
}
