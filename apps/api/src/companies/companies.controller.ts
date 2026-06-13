import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";

class UpdateCompanySettingsDto {
  @IsOptional() @IsInt() @Min(1) @Max(31) payrollCutoffDay?: number;
  @IsOptional() @IsString() statutoryCurrency?: string;
  @IsOptional() @IsBoolean() enableMfa?: boolean;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() baseCurrency?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() registration?: string;
}

class CreateCompanyDto {
  @IsString() name!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() baseCurrency?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() registration?: string;
  // First admin user
  @IsOptional() @IsString() adminEmail?: string;
  @IsOptional() @IsString() adminName?: string;
  @IsOptional() @IsString() adminPassword?: string;
}

@ApiTags("Company Settings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("company")
export class CompaniesController {
  constructor(private readonly prisma: PrismaService, private readonly email: EmailService) {}

  @Get()
  get(@CurrentUser() user: { companyId: string }) {
    return this.prisma.company.findUnique({ where: { id: user.companyId }, include: { settings: true } });
  }

  @Patch("settings")
  @Roles("OWNER", "ADMIN", "SUPER_ADMIN" as any)
  async updateSettings(@CurrentUser() user: { companyId: string }, @Body() body: UpdateCompanySettingsDto) {
    // Update company fields if provided
    if (body.name || body.country || body.baseCurrency || body.address || body.email || body.phone || body.taxNumber || body.registration) {
      await (this.prisma.company as any).update({
        where: { id: user.companyId },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.country && { country: body.country }),
          ...(body.baseCurrency && { baseCurrency: body.baseCurrency }),
          ...(body.address && { address: body.address }),
          ...(body.email && { email: body.email }),
          ...(body.phone && { phone: body.phone }),
          ...(body.taxNumber && { taxNumber: body.taxNumber }),
          ...(body.registration && { registration: body.registration }),
        },
      });
    }
    return this.prisma.companySetting.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        payrollCutoffDay: body.payrollCutoffDay ?? 25,
        statutoryCurrency: body.statutoryCurrency ?? "TZS",
        enableMfa: body.enableMfa ?? true,
      },
      update: {
        payrollCutoffDay: body.payrollCutoffDay,
        statutoryCurrency: body.statutoryCurrency,
        enableMfa: body.enableMfa,
      },
    });
  }

  // ── Super Admin: list all companies ──────────────────────────────────────
  @Get("all")
  @Roles("OWNER", "ADMIN", "SUPER_ADMIN" as any)
  async listAll(@CurrentUser() user: { companyId: string; roles: string[] }) {
    const isPlatformAdmin = (user.roles ?? []).some(r => ["SUPER_ADMIN","OWNER","ADMIN"].includes(r));
    // Check if this is the platform company (7D Global Projects)
    const myCompany = await (this.prisma.company as any).findUnique({ where: { id: user.companyId }, select: { slug: true } });
    const isPlatformSlug = myCompany?.slug?.includes("7d") || (user.roles ?? []).includes("SUPER_ADMIN");
    if (!isPlatformAdmin || !isPlatformSlug) {
      // Non-platform users only see their own company
      return (this.prisma.company as any).findMany({
        where: { id: user.companyId },
        include: { settings: true, _count: { select: { employees: true, payrollRuns: true } } },
        orderBy: { createdAt: "asc" },
      });
    }
    return (this.prisma.company as any).findMany({
      include: { settings: true, _count: { select: { employees: true, payrollRuns: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  // ── Super Admin: create new company ──────────────────────────────────────
  @Post("create")
  @Roles("OWNER", "SUPER_ADMIN" as any)
  async createCompany(@Body() dto: CreateCompanyDto) {
    const slug = dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const company = await (this.prisma.company as any).create({
      data: {
        name: dto.name,
        slug,
        country: dto.country ?? "TZ",
        baseCurrency: dto.baseCurrency ?? "TZS",
        address: dto.address,
        email: dto.email,
        taxNumber: dto.taxNumber,
        registration: dto.registration,
        settings: {
          create: {
            payrollCutoffDay: 25,
            statutoryCurrency: dto.baseCurrency ?? "TZS",
            enableMfa: false,
          },
        },
      },
    });
    // Auto-create first admin user if email provided
    if (dto.adminEmail) {
      const argon2 = await import("argon2");
      const tempPassword = dto.adminPassword ?? "Welcome2025#";
      const passwordHash = await argon2.hash(tempPassword);
      await (this.prisma.user as any).create({
        data: {
          companyId: company.id,
          name: dto.adminName ?? "Admin",
          email: dto.adminEmail,
          passwordHash,
          roles: ["OWNER", "ADMIN"],
        },
      });
      return {
        ...company,
        adminCredentials: {
          companySlug: company.slug,
          email: dto.adminEmail,
          tempPassword,
          loginUrl: `/login?company=${company.slug}`,
        },
      };
    }
    return company;
  }

  // ── Delete company ────────────────────────────────────────────────────────
  @Delete("delete/:id")
  @Roles("OWNER", "SUPER_ADMIN" as any)
  async deleteCompany(@Param("id") id: string) {
    // Delete in order: payroll lines → payroll runs → employees → users → settings → company
    await (this.prisma as any).$transaction([
      (this.prisma as any).payrollLine.deleteMany({ where: { companyId: id } }),
      (this.prisma as any).payrollRun.deleteMany({ where: { companyId: id } }),
      (this.prisma as any).leaveRequest.deleteMany({ where: { companyId: id } }),
      (this.prisma as any).employee.deleteMany({ where: { companyId: id } }),
      (this.prisma as any).user.deleteMany({ where: { companyId: id } }),
      (this.prisma as any).companySetting.deleteMany({ where: { companyId: id } }),
      (this.prisma as any).company.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  // ── Add user to specific company (platform admin) ─────────────────────────
  @Post("add-user")
  @Roles("OWNER", "ADMIN", "SUPER_ADMIN" as any)
  async addUserToCompany(@Body() dto: { companyId: string; name: string; email: string; role: string; tempPassword?: string }) {
    const argon2 = await import("argon2");
    const tempPassword = dto.tempPassword || "Welcome2025#";
    const passwordHash = await argon2.hash(tempPassword);
    const user = await (this.prisma.user as any).create({
      data: {
        companyId: dto.companyId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        roles: [dto.role],
        isActive: true,
      },
      select: { id: true, name: true, email: true, roles: true },
    });
    return { ...user, tempPassword };
  }
}
