import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/current-user";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Audit Logs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("OWNER", "ADMIN", "AUDITOR")
@Controller("audit-logs")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: { companyId: string }, @Query("take") take = "50") {
    return this.prisma.auditLog.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(take) || 50, 200),
    });
  }
}
