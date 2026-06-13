import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import * as argon2 from "argon2";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("User Management")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles("OWNER", "ADMIN")
  list(@CurrentUser() user: { companyId: string }) {
    return this.prisma.user.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true, name: true, email: true, roles: true,
        mfaEnabled: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { email: "asc" },
    });
  }

  @Post()
  @Roles("OWNER", "ADMIN")
  async createUser(
    @CurrentUser() user: { companyId: string },
    @Body() body: { name: string; email: string; role: string; tempPassword: string },
  ) {
    const existing = await this.prisma.user.findFirst({ where: { email: body.email } });
    if (existing) throw new Error(`User ${body.email} already exists.`);
    const passwordHash = await argon2.hash(body.tempPassword);
    return this.prisma.user.create({
      data: {
        companyId: user.companyId,
        name: body.name,
        email: body.email,
        passwordHash,
        roles: [body.role as any],
      },
      select: { id: true, name: true, email: true, roles: true, createdAt: true },
    });
  }

  @Patch("roles")
  @Roles("OWNER", "ADMIN")
  async updateRoles(
    @CurrentUser() user: { companyId: string },
    @Body() body: { userId: string; roles: string[] },
  ) {
    await this.prisma.user.findFirstOrThrow({ where: { id: body.userId, companyId: user.companyId } });
    return this.prisma.user.update({
      where: { id: body.userId },
      data: { roles: body.roles as any },
      select: { id: true, name: true, email: true, roles: true },
    });
  }

  @Patch(":id/reset-password")
  @Roles("OWNER", "ADMIN")
  async resetPassword(
    @CurrentUser() user: { companyId: string },
    @Param("id") id: string,
    @Body() body: { newPassword: string },
  ) {
    await this.prisma.user.findFirstOrThrow({ where: { id, companyId: user.companyId } });
    const passwordHash = await argon2.hash(body.newPassword);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { ok: true, message: "Password reset successfully." };
  }

  @Patch("me/change-password")
  async changeOwnPassword(
    @CurrentUser() user: { sub: string },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const dbUser = await this.prisma.user.findFirstOrThrow({ where: { id: user.sub } });
    const valid = await argon2.verify(dbUser.passwordHash, body.currentPassword);
    if (!valid) throw new Error("Current password is incorrect.");
    const passwordHash = await argon2.hash(body.newPassword);
    await this.prisma.user.update({ where: { id: user.sub }, data: { passwordHash } });
    return { ok: true, message: "Password changed successfully." };
  }

  @Patch(":id/deactivate")
  @Roles("OWNER")
  async deactivate(@CurrentUser() user: { companyId: string }, @Param("id") id: string) {
    await this.prisma.user.findFirstOrThrow({ where: { id, companyId: user.companyId } });
    return this.prisma.user.update({
      where: { id },
      data: { mfaEnabled: false },
      select: { id: true, email: true },
    });
  }
}
