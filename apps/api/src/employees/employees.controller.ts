import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { CreateEmployeeDto, SalaryHistoryDto } from "./dto";
import { EmployeesService } from "./employees.service";

@ApiTags("Employees")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("employees")
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  list(@CurrentUser() user: { companyId: string }, @Query("search") search?: string) {
    return this.employees.list(user.companyId, search);
  }

  @Get(":id")
  get(@CurrentUser() user: { companyId: string }, @Param("id") id: string) {
    return this.employees.get(user.companyId, id);
  }

  @Post()
  @Roles("OWNER", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "PAYROLL_PROCESSOR")
  create(@CurrentUser() user: { companyId: string; sub: string }, @Body() dto: CreateEmployeeDto) {
    return this.employees.create(user.companyId, user.sub, dto);
  }

  @Patch(":id")
  @Roles("OWNER", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "PAYROLL_PROCESSOR")
  update(@CurrentUser() user: { companyId: string; sub: string }, @Param("id") id: string, @Body() dto: Partial<CreateEmployeeDto>) {
    return this.employees.update(user.companyId, user.sub, id, dto);
  }

  @Post(":id/salary-history")
  @Roles("OWNER", "ADMIN", "HR_MANAGER", "PAYROLL_MANAGER")
  addSalaryHistory(@CurrentUser() user: { companyId: string; sub: string }, @Param("id") id: string, @Body() dto: SalaryHistoryDto) {
    return this.employees.addSalaryHistory(user.companyId, user.sub, id, dto);
  }

  @Get(":id/ytd")
  ytd(@CurrentUser() user: { companyId: string }, @Param("id") id: string, @Query("year") year = "2026") {
    return this.employees.ytd(user.companyId, id, Number(year));
  }
}
