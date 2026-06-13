import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePayrollRunDto, UpdatePayrollLineDto } from "./dto";
import { EmailService } from "../email/email.service";
import { PayrollEngineService } from "./payroll-engine.service";

const dec = (v: number): any => v;

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: PayrollEngineService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  list(companyId: string) {
    return (this.prisma.payrollRun as any).findMany({
      where: { companyId },
      include: { items: { include: { employee: true } }, company: true },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    });
  }

  get(companyId: string, id: string) {
    return (this.prisma.payrollRun as any).findFirstOrThrow({
      where: { companyId, id },
      include: {
        items: {
          include: { employee: true },
          orderBy: { employee: { firstName: "asc" } },
        },
        company: true,
      },
    });
  }

  async create(companyId: string, actorId: string, dto: CreatePayrollRunDto) {
    const company = await this.prisma.company.findFirstOrThrow({ where: { id: companyId } });

    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        isActive: true,
        ...(dto.employeeIds?.length ? { id: { in: dto.employeeIds } } : {}),
      },
    });
    if (!employees.length) throw new BadRequestException("No active employees found");
    if (employees.some((e: any) => e.currency === "USD") && !dto.exchangeRate) {
      throw new BadRequestException("Exchange rate is required — this company has USD employees");
    }

    const deductionsActive = dto.deductionsActive !== false;

    const calculated = employees.map((employee: any) => {
      const result = this.engine.calculate({
        payType:            employee.employmentType,
        currency:           employee.currency,
        country:            (company.country ?? "TZ") as any,
        periodMonth:        dto.periodMonth,
        periodYear:         dto.periodYear,
        startDate:          employee.startDate,
        endDate:            employee.endDate,
        fixedSalaryTzs:     Number(employee.baseSalary),
        usdSalary:          employee.usdSalary ? Number(employee.usdSalary) : 0,
        exchangeRate:       dto.exchangeRate,
        hourlyRateTzs:      employee.hourlyRate ? Number(employee.hourlyRate) : 0,
        stdHoursPerMonth:   employee.stdHoursPerMonth ? Number(employee.stdHoursPerMonth) : 234,
        actualHoursWorked:  employee.employmentType === "HOURLY" ? 0 : (employee.stdHoursPerMonth ? Number(employee.stdHoursPerMonth) : 234),
        housingAllowance:   employee.housingAllowance ? Number(employee.housingAllowance) : 0,
        transportAllowance: employee.transportAllowance ? Number(employee.transportAllowance) : 0,
        siteAllowance:      employee.siteAllowance ? Number(employee.siteAllowance) : 0,
        standbyDailyRate:   employee.standbyDailyRate ? Number(employee.standbyDailyRate) : 0,
        workingDays:        dto.workingDays ?? (company as any).workingDays ?? 26,
        standardHoursPerDay: dto.standardHoursPerDay ?? (company as any).stdHoursPerDay ?? 9,
        deductionsActive,
      });
      return { employee, result };
    });

    const totals = this.sumTotals(calculated.map((c: any) => c.result));
    const run = await (this.prisma.payrollRun as any).create({
      data: {
        companyId,
        periodMonth:         dto.periodMonth,
        periodYear:          dto.periodYear,
        workingDays:         dto.workingDays ?? 26,
        standardHoursPerDay: dec(dto.standardHoursPerDay ?? 9),
        exchangeRate:        dto.exchangeRate ? dec(dto.exchangeRate) : undefined,
        deductionsActive,
        payCycle:            dto.payCycle ?? "MONTHLY",
        paymentDate:         new Date(dto.paymentDate),
        status:              "DRAFT",
        createdById:         actorId,
        totals:              totals as any,
        items: {
          create: calculated.map(({ employee, result }: any) => ({
            companyId,
            employeeId:        employee.id,
            actualHours:       dec(result.actualHoursWorked),
            basicPay:          dec(result.basicPay),
            otPay:             dec(result.otPay),
            ot20Pay:           dec(result.ot20Pay),
            phPay:             dec(result.phPay),
            standbyPay:        dec(result.standbyPay),
            callout15Pay:      dec(result.callout15Pay),
            callout20Pay:      dec(result.callout20Pay),
            grossPay:          dec(result.grossPay),
            taxablePay:        dec(result.taxablePay),
            paye:              dec(result.paye),
            nssfEmployee:      dec(result.pensionEmployee),
            nssfEmployer:      dec(result.pensionEmployer),
            sdl:               dec(result.sdl),
            wcf:               dec(result.wcf),
            levy:              dec(result.levy),
            totalEmployerCost: dec(result.totalEmployerCost),
            netPay:            dec(result.netPay),
            ytdGross:          dec(result.grossPay),
            ytdPaye:           dec(result.paye),
            ytdNssf:           dec(result.pensionEmployee),
            ytdNet:            dec(result.netPay),
            details:           result as any,
          })),
        },
      },
      include: { items: { include: { employee: true } }, company: true },
    });

    await this.audit.write(companyId, actorId, "CREATE", "PayrollRun", run.id, undefined, run);
    return run;
  }

  async updateLine(
    companyId: string, actorId: string, runId: string, lineId: string, dto: UpdatePayrollLineDto,
  ) {
    const line = await (this.prisma.payrollItem as any).findFirstOrThrow({
      where: { id: lineId, companyId, payrollRunId: runId },
      include: { employee: true, payrollRun: true },
    });
    const company = await this.prisma.company.findFirstOrThrow({ where: { id: companyId } });

    const result = this.engine.calculate({
      payType:            line.employee.employmentType,
      currency:           line.employee.currency,
      country:            (company.country ?? "TZ") as any,
      periodMonth:        line.payrollRun.periodMonth,
      periodYear:         line.payrollRun.periodYear,
      startDate:          line.employee.startDate,
      endDate:            line.employee.endDate,
      fixedSalaryTzs:     Number(line.employee.baseSalary),
      usdSalary:          line.employee.usdSalary ? Number(line.employee.usdSalary) : 0,
      exchangeRate:       line.payrollRun.exchangeRate ? Number(line.payrollRun.exchangeRate) : undefined,
      hourlyRateTzs:      line.employee.hourlyRate ? Number(line.employee.hourlyRate) : 0,
      stdHoursPerMonth:   line.employee.stdHoursPerMonth ? Number(line.employee.stdHoursPerMonth) : 234,
      actualHoursWorked:  dto.actualHours ?? Number(line.actualHours),
      otHours:            dto.otHours ?? Number(line.otHours),
      ot20Hours:          dto.ot20Hours ?? Number(line.ot20Hours ?? 0),
      phHours:            dto.phHours ?? Number(line.phHours),
      standbyDays:        dto.standbyDays ?? Number(line.standbyDays ?? 0),
      standbyDailyRate:   line.employee.standbyDailyRate ? Number(line.employee.standbyDailyRate) : 0,
      callout15Hours:     dto.callout15Hours ?? Number(line.callout15Hours ?? 0),
      callout20Hours:     dto.callout20Hours ?? Number(line.callout20Hours ?? 0),
      bonus:              dto.bonus ?? Number(line.bonus ?? 0),
      otherAdditions:     dto.otherAdditions ?? Number(line.otherAdditions),
      otherDeductions:    dto.otherDeductions ?? Number(line.otherDeductions),
      adjustments:        dto.adjustments ?? Number(line.adjustments),
      housingAllowance:   line.employee.housingAllowance ? Number(line.employee.housingAllowance) : 0,
      transportAllowance: line.employee.transportAllowance ? Number(line.employee.transportAllowance) : 0,
      siteAllowance:      line.employee.siteAllowance ? Number(line.employee.siteAllowance) : 0,
      deductionsActive:   line.payrollRun.deductionsActive,
      workingDays:        line.payrollRun.workingDays,
      standardHoursPerDay: Number(line.payrollRun.standardHoursPerDay),
    });

    const before = { ...line };
    const updated = await (this.prisma.payrollItem as any).update({
      where: { id: lineId },
      data: {
        actualHours:      dec(dto.actualHours ?? Number(line.actualHours)),
        otHours:          dec(dto.otHours ?? Number(line.otHours)),
        ot20Hours:        dec(dto.ot20Hours ?? Number(line.ot20Hours ?? 0)),
        phHours:          dec(dto.phHours ?? Number(line.phHours)),
        standbyDays:      dec(dto.standbyDays ?? Number(line.standbyDays ?? 0)),
        callout15Hours:   dec(dto.callout15Hours ?? Number(line.callout15Hours ?? 0)),
        callout20Hours:   dec(dto.callout20Hours ?? Number(line.callout20Hours ?? 0)),
        bonus:            dec(dto.bonus ?? Number(line.bonus ?? 0)),
        otherAdditions:   dec(dto.otherAdditions ?? Number(line.otherAdditions)),
        otherDeductions:  dec(dto.otherDeductions ?? Number(line.otherDeductions)),
        adjustments:      dec(dto.adjustments ?? Number(line.adjustments)),
        basicPay:         dec(result.basicPay),
        otPay:            dec(result.otPay),
        ot20Pay:          dec(result.ot20Pay),
        phPay:            dec(result.phPay),
        standbyPay:       dec(result.standbyPay),
        callout15Pay:     dec(result.callout15Pay),
        callout20Pay:     dec(result.callout20Pay),
        grossPay:         dec(result.grossPay),
        taxablePay:       dec(result.taxablePay),
        paye:             dec(result.paye),
        nssfEmployee:     dec(result.pensionEmployee),
        nssfEmployer:     dec(result.pensionEmployer),
        sdl:              dec(result.sdl),
        wcf:              dec(result.wcf),
        levy:             dec(result.levy),
        totalEmployerCost: dec(result.totalEmployerCost),
        netPay:           dec(result.netPay),
        details:          result as any,
      },
      include: { employee: true },
    });

    await this.recalculateTotals(companyId, runId);
    await this.audit.write(companyId, actorId, "UPDATE", "PayrollItem", lineId, before, updated);
    return updated;
  }

  async approve(companyId: string, actorId: string, id: string) {
    const before = await this.prisma.payrollRun.findFirstOrThrow({ where: { companyId, id } });
    if (before.status === "LOCKED") throw new BadRequestException("Cannot modify a locked payroll run");
    const run = await (this.prisma.payrollRun as any).update({
      where: { id },
      data: { status: "APPROVED", approvedBy: actorId, approvedAt: new Date() },
      include: { items: { include: { employee: true } } },
    });
    await this.audit.write(companyId, actorId, "APPROVE", "PayrollRun", id, before, run);
    // Send email notification to all OWNER/ADMIN users in the company
    try {
      const company = await this.prisma.company.findUnique({ where: { id: companyId } });
      const admins = await this.prisma.user.findMany({
        where: { companyId, roles: { hasSome: ["OWNER", "ADMIN"] as any } },
        select: { email: true, name: true },
      });
      const period = `${new Date(0, run.periodMonth - 1).toLocaleString("en", { month: "long" })} ${run.periodYear}`;
      for (const admin of admins) {
        await this.email.sendPayrollApproved(admin.email, admin.name || "", company?.name || "", period, company?.slug || "");
      }
    } catch {}
    return run;
  }

  async lock(companyId: string, actorId: string, id: string) {
    const run = await this.get(companyId, id);
    if (run.status === "LOCKED") throw new BadRequestException("Already locked");

    const previousRuns = await this.prisma.payrollRun.findMany({
      where: {
        companyId,
        status: { in: ["APPROVED", "LOCKED"] as any },
        OR: [
          { periodYear: { lt: run.periodYear } },
          { periodYear: run.periodYear, periodMonth: { lt: run.periodMonth } },
        ],
      },
      include: { items: true },
    });

    const ytdByEmployee: Record<string, { gross: number; paye: number; nssf: number; net: number }> = {};
    for (const prev of previousRuns) {
      for (const item of prev.items) {
        const ytd = ytdByEmployee[item.employeeId] ?? { gross: 0, paye: 0, nssf: 0, net: 0 };
        ytdByEmployee[item.employeeId] = {
          gross: ytd.gross + Number(item.grossPay),
          paye:  ytd.paye  + Number(item.paye),
          nssf:  ytd.nssf  + Number(item.nssfEmployee),
          net:   ytd.net   + Number(item.netPay),
        };
      }
    }

    const locked = await this.prisma.$transaction(async (tx: any) => {
      const updatedRun = await tx.payrollRun.update({
        where: { id },
        data: { status: "LOCKED", lockedBy: actorId, lockedAt: new Date() },
        include: { items: { include: { employee: true } } },
      });

      for (const item of updatedRun.items) {
        const prev = ytdByEmployee[item.employeeId] ?? { gross: 0, paye: 0, nssf: 0, net: 0 };
        await tx.payrollItem.update({
          where: { id: item.id },
          data: {
            ytdGross: dec(prev.gross + Number(item.grossPay)),
            ytdPaye:  dec(prev.paye  + Number(item.paye)),
            ytdNssf:  dec(prev.nssf  + Number(item.nssfEmployee)),
            ytdNet:   dec(prev.net   + Number(item.netPay)),
          },
        });
        await tx.payrollLineSnapshot.upsert({
          where: { payrollLineId: item.id },
          update:  { snapshotData: item as any, lockedAt: new Date(), lockedBy: actorId },
          create:  { payrollLineId: item.id, companyId, snapshotData: item as any, lockedAt: new Date(), lockedBy: actorId },
        });
      }
      return updatedRun;
    });

    await this.audit.write(companyId, actorId, "LOCK", "PayrollRun", id, run, locked);
    return locked;
  }

  async toggleDeductions(companyId: string, actorId: string, runId: string, active: boolean) {
    const run = await this.prisma.payrollRun.findFirstOrThrow({ where: { companyId, id: runId } });
    if (run.status === "LOCKED") throw new BadRequestException("Cannot modify locked run");

    const company = await this.prisma.company.findFirstOrThrow({ where: { id: companyId } });
    const items = await (this.prisma.payrollItem as any).findMany({
      where: { payrollRunId: runId },
      include: { employee: true },
    });

    await this.prisma.$transaction(async (tx: any) => {
      await tx.payrollRun.update({ where: { id: runId }, data: { deductionsActive: active } });
      for (const item of items) {
        const result = this.engine.calculate({
          payType:            item.employee.employmentType,
          currency:           item.employee.currency,
          country:            (company.country ?? "TZ") as any,
          periodMonth:        run.periodMonth,
          periodYear:         run.periodYear,
          startDate:          item.employee.startDate,
          endDate:            item.employee.endDate,
          fixedSalaryTzs:     Number(item.employee.baseSalary),
          usdSalary:          item.employee.usdSalary ? Number(item.employee.usdSalary) : 0,
          exchangeRate:       run.exchangeRate ? Number(run.exchangeRate) : undefined,
          hourlyRateTzs:      item.employee.hourlyRate ? Number(item.employee.hourlyRate) : 0,
          stdHoursPerMonth:   item.employee.stdHoursPerMonth ? Number(item.employee.stdHoursPerMonth) : 234,
          actualHoursWorked:  Number(item.actualHours),
          otHours:            Number(item.otHours),
          ot20Hours:          Number(item.ot20Hours ?? 0),
          phHours:            Number(item.phHours),
          standbyDays:        Number(item.standbyDays ?? 0),
          standbyDailyRate:   item.employee.standbyDailyRate ? Number(item.employee.standbyDailyRate) : 0,
          callout15Hours:     Number(item.callout15Hours ?? 0),
          callout20Hours:     Number(item.callout20Hours ?? 0),
          bonus:              Number(item.bonus ?? 0),
          otherAdditions:     Number(item.otherAdditions),
          otherDeductions:    Number(item.otherDeductions),
          adjustments:        Number(item.adjustments),
          housingAllowance:   item.employee.housingAllowance ? Number(item.employee.housingAllowance) : 0,
          transportAllowance: item.employee.transportAllowance ? Number(item.employee.transportAllowance) : 0,
          siteAllowance:      item.employee.siteAllowance ? Number(item.employee.siteAllowance) : 0,
          deductionsActive:   active,
          workingDays:        run.workingDays,
          standardHoursPerDay: Number(run.standardHoursPerDay),
        });
        await tx.payrollItem.update({
          where: { id: item.id },
          data: {
            paye: dec(result.paye), nssfEmployee: dec(result.pensionEmployee),
            nssfEmployer: dec(result.pensionEmployer), sdl: dec(result.sdl),
            wcf: dec(result.wcf), levy: dec(result.levy),
            taxablePay: dec(result.taxablePay), netPay: dec(result.netPay),
            totalEmployerCost: dec(result.totalEmployerCost), details: result as any,
          },
        });
      }
    });

    await this.recalculateTotals(companyId, runId);
    await this.audit.write(companyId, actorId, "UPDATE", "PayrollRun", runId, { deductionsActive: !active }, { deductionsActive: active });
    return this.get(companyId, runId);
  }

  // ── Sage Guide Ch. 14: Reverse a payroll run ──────────────────────────────
  async reverse(companyId: string, actorId: string, id: string, reason?: string) {
    const run = await this.prisma.payrollRun.findFirstOrThrow({ where: { companyId, id } });
    if (run.status === "LOCKED") {
      throw new BadRequestException("Cannot reverse a LOCKED run. Ask an OWNER to reopen it first.");
    }
    if ((run as any).reversedAt) {
      throw new BadRequestException("This payroll run has already been reversed.");
    }
    const emptyTotals = { grossPay: 0, paye: 0, nssfEmployee: 0, nssfEmployer: 0, sdl: 0, wcf: 0, levy: 0, netPay: 0, totalEmployerCost: 0 };
    await (this.prisma.payrollRun as any).update({
      where: { id },
      data: { status: "DRAFT", reversedBy: actorId, reversedAt: new Date(), approvedBy: null, approvedAt: null, totals: emptyTotals as any },
    });
    const items = await (this.prisma.payrollItem as any).findMany({ where: { payrollRunId: id } });
    if (items.length) {
      await this.prisma.$transaction(
        items.map((item: any) =>
          (this.prisma.payrollItem as any).update({
            where: { id: item.id },
            data: { paye: 0, nssfEmployee: 0, nssfEmployer: 0, sdl: 0, wcf: 0, grossPay: 0, netPay: 0, taxablePay: 0, totalEmployerCost: 0 },
          })
        )
      );
    }
    await this.audit.write(companyId, actorId, "UPDATE", "PayrollRun", id,
      { status: run.status }, { status: "DRAFT", reversedAt: new Date(), reason });
    return this.get(companyId, id);
  }

  // ── Sage Guide Ch. 15: Period-end checklist ──────────────────────────────
  async getPeriodEndChecklist(companyId: string, runId: string) {
    const run = await this.get(companyId, runId);
    const hasLocked  = run.status === "LOCKED";
    const hasApproved = run.status === "APPROVED" || hasLocked;

    const prevMonth = run.periodMonth === 1 ? 12 : run.periodMonth - 1;
    const prevYear  = run.periodMonth === 1 ? run.periodYear - 1 : run.periodYear;
    const prevRun = await this.prisma.payrollRun.findFirst({
      where: { companyId, periodMonth: prevMonth, periodYear: prevYear },
    });

    return {
      run: { id: run.id, period: `${run.periodMonth}/${run.periodYear}`, status: run.status, employeeCount: run.items.length },
      checklist: [
        { step: 1, title: "Timesheets verified and hours entered", complete: run.items.length > 0 && run.status !== "DRAFT",
          note: `${run.items.length} employees in this run.` },
        { step: 2, title: "Exchange rate confirmed", complete: !!(run as any).exchangeRate,
          note: (run as any).exchangeRate ? `Rate: ${Number((run as any).exchangeRate).toLocaleString()} TZS/USD` : "No exchange rate — required for USD employees." },
        { step: 3, title: "Payroll run approved", complete: hasApproved,
          note: hasApproved ? `Approved by ${run.approvedBy ?? "—"}` : "Pending approval." },
        { step: 4, title: "Payroll run locked and YTD updated", complete: hasLocked,
          note: hasLocked ? `Locked at ${run.lockedAt ?? "—"}` : "Lock to freeze YTD figures." },
        { step: 5, title: "Payslips distributed to employees", complete: hasLocked,
          note: "Download payslips from the payroll run page after locking." },
        { step: 6, title: "PAYE return filed with TRA", complete: false,
          note: `Due: 15th of following month. Amount: ${Math.round((run as any).totals?.paye ?? 0).toLocaleString()} TZS.` },
        { step: 7, title: "NSSF schedule submitted", complete: false,
          note: `Due: End of month. EE: ${Math.round((run as any).totals?.nssfEmployee ?? 0).toLocaleString()} + ER: ${Math.round((run as any).totals?.nssfEmployer ?? 0).toLocaleString()} TZS.` },
        { step: 8, title: "SDL return filed", complete: false,
          note: `Due: 15th of following month. Amount: ${Math.round((run as any).totals?.sdl ?? 0).toLocaleString()} TZS.` },
        { step: 9, title: "Employee bank transfers initiated", complete: hasLocked,
          note: "Download bank payment CSV from Reports page." },
        { step: 10, title: "Previous month run completed",
          complete: !prevRun || prevRun.status === "LOCKED",
          note: prevRun ? `${prevMonth}/${prevYear} run status: ${prevRun.status}` : `No ${prevMonth}/${prevYear} run found.` },
      ],
    };
  }

  // ── Sage Guide Ch. 9: Leave accrual summary ──────────────────────────────
  async getLeaveAccrualSummary(companyId: string, runId: string) {
    const run = await this.get(companyId, runId);
    const { calculateLeaveAccrual } = await import("@payroll/schemas");
    const company = await this.prisma.company.findFirstOrThrow({ where: { id: companyId } });

    return run.items.map((item: any) => {
      const emp = item.employee;
      const accrual = calculateLeaveAccrual(emp.startDate, run.periodYear, run.periodMonth, (company.country ?? "TZ") as any);
      return {
        employeeId: emp.id, employeeNumber: emp.employeeNumber,
        fullName: emp.fullName ?? `${emp.firstName} ${emp.lastName}`,
        startDate: emp.startDate, ...accrual,
        currentAnnualBalance: Number(emp.leaveAnnualBalance ?? 0),
        currentSickBalance:   Number(emp.leaveSickBalance ?? 0),
      };
    });
  }

  private async recalculateTotals(companyId: string, runId: string) {
    const items = await (this.prisma.payrollItem as any).findMany({ where: { companyId, payrollRunId: runId } });
    await this.prisma.payrollRun.update({
      where: { id: runId },
      data: { totals: this.sumTotals(items) as any },
    });
  }

  private sumTotals(items: any[]): Record<string, number> {
    return items.reduce(
      (acc: any, item: any) => ({
        grossPay:          acc.grossPay          + Number(item.grossPay ?? 0),
        paye:              acc.paye              + Number(item.paye ?? 0),
        nssfEmployee:      acc.nssfEmployee      + Number(item.nssfEmployee ?? 0),
        nssfEmployer:      acc.nssfEmployer      + Number(item.nssfEmployer ?? 0),
        sdl:               acc.sdl               + Number(item.sdl ?? 0),
        wcf:               acc.wcf               + Number(item.wcf ?? 0),
        levy:              acc.levy              + Number(item.levy ?? 0),
        netPay:            acc.netPay            + Number(item.netPay ?? 0),
        totalEmployerCost: acc.totalEmployerCost + Number(item.totalEmployerCost ?? 0),
      }),
      { grossPay: 0, paye: 0, nssfEmployee: 0, nssfEmployer: 0, sdl: 0, wcf: 0, levy: 0, netPay: 0, totalEmployerCost: 0 },
    );
  }
}
