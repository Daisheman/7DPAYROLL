import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeDto, SalaryHistoryDto } from "./dto";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(companyId: string, search?: string) {
    const contains = search?.trim();
    return this.prisma.employee.findMany({
      where: {
        companyId,
        isActive: true,
        ...(contains
          ? {
              OR: [
                { firstName: { contains, mode: "insensitive" } },
                { lastName: { contains, mode: "insensitive" } },
                { employeeNumber: { contains, mode: "insensitive" } },
                { email: { contains, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  async create(companyId: string, actorId: string, dto: CreateEmployeeDto) {
    const employee = await this.prisma.employee.create({
      data: {
        companyId,
        ...dto,
        fullName: dto.fullName ?? `${dto.firstName} ${dto.lastName}`,
        contractType: (dto.contractType ?? "PERMANENT") as any,
        // @ts-ignore
        currency: dto.currency ?? "TZS",
        baseSalary: dto.baseSalary as any,
        hourlyRate: dto.hourlyRate === undefined ? undefined : dto.hourlyRate as any,
        dailyRate: dto.dailyRate === undefined ? undefined : dto.dailyRate as any,
        usdSalary: dto.usdSalary === undefined ? undefined : dto.usdSalary as any,
        stdHoursPerMonth: dto.stdHoursPerMonth === undefined ? undefined : dto.stdHoursPerMonth as any,
        housingAllowance: dto.housingAllowance === undefined ? undefined : dto.housingAllowance as any,
        transportAllowance: dto.transportAllowance === undefined ? undefined : dto.transportAllowance as any,
        siteAllowance: dto.siteAllowance === undefined ? undefined : dto.siteAllowance as any,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    await this.audit.write(companyId, actorId, "CREATE", "Employee", employee.id, undefined, employee);
    return employee;
  }

  async update(companyId: string, actorId: string, id: string, dto: Partial<CreateEmployeeDto>) {
    const before = await this.get(companyId, id);
    const employee = await (this.prisma.employee as any).update({
      where: { id },
      data: {
        ...dto,
        fullName: dto.fullName ?? (dto.firstName || dto.lastName ? `${dto.firstName ?? before.firstName} ${dto.lastName ?? before.lastName}` : undefined),
        baseSalary: dto.baseSalary === undefined ? undefined : dto.baseSalary as any,
        hourlyRate: dto.hourlyRate === undefined ? undefined : dto.hourlyRate as any,
        dailyRate: dto.dailyRate === undefined ? undefined : dto.dailyRate as any,
        usdSalary: dto.usdSalary === undefined ? undefined : dto.usdSalary as any,
        stdHoursPerMonth: dto.stdHoursPerMonth === undefined ? undefined : dto.stdHoursPerMonth as any,
        housingAllowance: dto.housingAllowance === undefined ? undefined : dto.housingAllowance as any,
        transportAllowance: dto.transportAllowance === undefined ? undefined : dto.transportAllowance as any,
        siteAllowance: dto.siteAllowance === undefined ? undefined : dto.siteAllowance as any,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    await this.audit.write(companyId, actorId, "UPDATE", "Employee", id, before, employee);
    return employee;
  }

  get(companyId: string, id: string) {
    return this.prisma.employee.findFirstOrThrow({ where: { companyId, id }, include: { salaryHistory: { orderBy: { effectiveDate: "desc" } } } });
  }

  async addSalaryHistory(companyId: string, actorId: string, employeeId: string, dto: SalaryHistoryDto) {
    await this.get(companyId, employeeId);
    const history = await this.prisma.salaryHistory.create({
      data: {
        companyId,
        employeeId,
        createdBy: actorId,
        effectiveDate: new Date(dto.effectiveDate),
        payType: dto.payType,
        // @ts-ignore
        currency: dto.currency,
        fixedSalaryTzs: dto.fixedSalaryTzs === undefined ? undefined : dto.fixedSalaryTzs as any,
        hourlyRateTzs: dto.hourlyRateTzs === undefined ? undefined : dto.hourlyRateTzs as any,
        stdHoursPerMonth: dto.stdHoursPerMonth === undefined ? undefined : dto.stdHoursPerMonth as any,
        usdSalary: dto.usdSalary === undefined ? undefined : dto.usdSalary as any,
        exchangeRate: dto.exchangeRate === undefined ? undefined : dto.exchangeRate as any,
        housingAllowance: dto.housingAllowance === undefined ? undefined : dto.housingAllowance as any,
        transportAllow: dto.transportAllow === undefined ? undefined : dto.transportAllow as any,
        siteAllowance: dto.siteAllowance === undefined ? undefined : dto.siteAllowance as any,
        reason: dto.reason,
      },
    });
    await this.audit.write(companyId, actorId, "CREATE", "SalaryHistory", history.id, undefined, history);
    return history;
  }

  async ytd(companyId: string, employeeId: string, year: number) {
    const start = new Date(year - 1, 6, 1);
    const end = new Date(year, 5, 30, 23, 59, 59);
    const lines = await this.prisma.payrollItem.findMany({
      where: { companyId, employeeId, payrollRun: { status: "LOCKED", paymentDate: { gte: start, lte: end } } },
      include: { payrollRun: true },
      orderBy: { payrollRun: { paymentDate: "asc" } },
    });
    const totals = lines.reduce(
      (acc, line) => ({
        grossPay: acc.grossPay + Number(line.grossPay),
        nssfEmployee: acc.nssfEmployee + Number(line.nssfEmployee),
        paye: acc.paye + Number(line.paye),
        otherDeductions: acc.otherDeductions + Number(line.otherDeductions),
        netPay: acc.netPay + Number(line.netPay),
        nssfEmployer: acc.nssfEmployer + Number(line.nssfEmployer),
        sdl: acc.sdl + Number(line.sdl),
        wcf: acc.wcf + Number(line.wcf),
      }),
      { grossPay: 0, nssfEmployee: 0, paye: 0, otherDeductions: 0, netPay: 0, nssfEmployer: 0, sdl: 0, wcf: 0 },
    );
    return {
      year,
      monthsWorked: lines.filter((line) => Number(line.netPay) > 0).length,
      ...totals,
      months: lines.map((line) => ({
        runId: line.payrollRunId,
        month: line.payrollRun.periodMonth,
        year: line.payrollRun.periodYear,
        grossPay: Number(line.grossPay),
        paye: Number(line.paye),
        nssfEmployee: Number(line.nssfEmployee),
        netPay: Number(line.netPay),
      })),
    };
  }
}
