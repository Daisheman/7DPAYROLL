import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("File Storage")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("files")
export class StorageController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: { companyId: string }) {
    return this.prisma.fileObject.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: "desc" } });
  }
}
