import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EarningsCodesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return (this.prisma.earningsCode as any).findMany({
      where: { companyId },
      orderBy: { code: "asc" },
    });
  }

  async create(companyId: string, data: any) {
    return (this.prisma.earningsCode as any).create({
      data: { companyId, ...data },
    });
  }

  async update(companyId: string, id: string, data: any) {
    await (this.prisma.earningsCode as any).findFirstOrThrow({ where: { id, companyId } });
    return (this.prisma.earningsCode as any).update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    await (this.prisma.earningsCode as any).findFirstOrThrow({ where: { id, companyId } });
    return (this.prisma.earningsCode as any).update({ where: { id }, data: { isActive: false } });
  }
}
