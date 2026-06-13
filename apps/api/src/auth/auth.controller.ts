import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CurrentUser } from "../common/current-user";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto, LoginDto } from "./dto";

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get("company-info")
  async companyInfo(@Query("slug") slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      select: { name: true, slug: true, country: true, baseCurrency: true },
    });
    if (!company) return { name: slug, slug };
    return company;
  }

  @Get("csrf")
  csrf() { return { csrfToken: null }; }

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.validateLogin(dto.companySlug, dto.email, dto.password, dto.mfaCode);
    res.cookie("access_token", session.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refresh_token", session.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    await this.audit.write(
      session.user.companyId, session.user.sub, "LOGIN", "User", session.user.sub,
      undefined, { email: session.user.email, roles: session.user.roles }, req,
    );
    return { user: session.user };
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.refresh(req.cookies.refresh_token);
    res.cookie("access_token", session.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refresh_token", session.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { user: session.user };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: { sub: string; companyId: string; email: string; roles: string[] }) {
    return { user };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@CurrentUser() user: { sub: string }, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(user.sub);
    res.clearCookie("access_token", cookieOptions);
    res.clearCookie("refresh_token", cookieOptions);
    return { ok: true };
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email, dto.companySlug);
  }

  @Post("reset-password")
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.auth.resetPassword(body.token, body.newPassword);
  }
}
