import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DeductionCodesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return (this.prisma.deductionCode as any).findMany({
      where: { companyId },
      include: {
        assignments: {
          where: { isActive: true },
          include: { employee: { select: { id: true, fullName: true, firstName: true, lastName: true, employeeNumber: true } } },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  async create(companyId: string, data: any) {
    return (this.prisma.deductionCode as any).create({ data: { companyId, ...data } });
  }

  async update(companyId: string, id: string, data: any) {
    await (this.prisma.deductionCode as any).findFirstOrThrow({ where: { id, companyId } });
    return (this.prisma.deductionCode as any).update({ where: { id }, data });
  }

  // Assign a deduction code to an employee (e.g. loan repayment)
  async assignToEmployee(companyId: string, data: {
    employeeId: string;
    deductionCodeId: string;
    amount: number;
    originalAmount?: number;
    balance?: number;
    startDate: string;
    endDate?: string;
    notes?: string;
  }) {
    return (this.prisma.employeeDeduction as any).create({
      data: {
        companyId,
        employeeId:      data.employeeId,
        deductionCodeId: data.deductionCodeId,
        amount:          data.amount,
        originalAmount:  data.originalAmount ?? data.amount,
        balance:         data.balance ?? data.amount,
        startDate:       new Date(data.startDate),
        endDate:         data.endDate ? new Date(data.endDate) : null,
        notes:           data.notes,
        isActive:        true,
      },
      include: { deductionCode: true, employee: { select: { fullName: true, employeeNumber: true } } },
    });
  }

  listEmployeeDeductions(companyId: string, employeeId?: string) {
    return (this.prisma.employeeDeduction as any).findMany({
      where: {
        companyId,
        isActive: true,
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        deductionCode: true,
        employee: { select: { id: true, fullName: true, firstName: true, lastName: true, employeeNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Update remaining balance (call after each payroll run)
  async reduceBalance(companyId: string, deductionId: string, amountDeducted: number) {
    const ded = await (this.prisma.employeeDeduction as any).findFirstOrThrow({ where: { id: deductionId, companyId } });
    const newBalance = Math.max(0, Number(ded.balance ?? 0) - amountDeducted);
    const isActive = newBalance > 0;
    return (this.prisma.employeeDeduction as any).update({
      where: { id: deductionId },
      data: { balance: newBalance, isActive },
    });
  }

  async deactivateAssignment(companyId: string, id: string) {
    await (this.prisma.employeeDeduction as any).findFirstOrThrow({ where: { id, companyId } });
    return (this.prisma.employeeDeduction as any).update({ where: { id }, data: { isActive: false } });
  }
}
