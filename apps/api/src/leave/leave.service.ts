import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { companyId },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
  }

  create(companyId: string, actorId: string, data: any) {
    return this.prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        days: data.days,
        payRate: data.payRate ?? 1,
        notes: data.notes,
        // @ts-ignore
        status: "APPROVED",
        // @ts-ignore
        approvedBy: actorId,
        // @ts-ignore
        approvedAt: new Date(),
      },
      include: { employee: true },
    });
  }

  approve(companyId: string, actorId: string, id: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      // @ts-ignore
      data: { status: "APPROVED", approvedBy: actorId, approvedAt: new Date() } as any,
    });
  }

  reject(companyId: string, id: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });
  }
}
