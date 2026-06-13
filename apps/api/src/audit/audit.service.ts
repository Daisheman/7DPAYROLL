import { AuditAction } from "../prisma/prisma-enums";
import { Injectable } from "@nestjs/common";
type JsonInput = any;
import { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(
    companyId: string,
    actorId: string | null,
    action: keyof typeof AuditAction,
    entity: string,
    entityId?: string,
    before?: unknown,
    after?: unknown,
    request?: Request,
  ) {
    return this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action: action as any,
        entity,
        entityId,
        before: before === undefined ? undefined : (before as JsonInput),
        after: after === undefined ? undefined : (after as JsonInput),
        ipAddress: request?.ip,
        userAgent: Array.isArray(request?.headers["user-agent"]) ? request?.headers["user-agent"][0] : request?.headers["user-agent"],
      },
    });
  }
}
