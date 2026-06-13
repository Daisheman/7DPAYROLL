import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { authenticator } from "otplib";
import { StringValue } from "ms";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../prisma/prisma-enums";
import { EmailService } from "../email/email.service";
import * as crypto from "crypto";

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async validateLogin(slug: string, emailInput: string, password: string, mfaCode?: string) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company) throw new UnauthorizedException("Company not found");

    const user = await this.prisma.user.findFirst({
      where: { companyId: company.id, email: emailInput.toLowerCase().trim() },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(`Account locked. Try again after ${user.lockedUntil.toISOString()}`);
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      const failed = user.failedLoginCount + 1;
      const lockedUntil = failed >= MAX_FAILED_LOGINS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: failed, ...(lockedUntil ? { lockedUntil } : {}) },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.mfaEnabled && user.mfaSecret) {
      if (!mfaCode || !authenticator.verify({ token: mfaCode, secret: user.mfaSecret })) {
        throw new UnauthorizedException("Invalid MFA code");
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return this.rotateTokens(user.id, company.id, user.email, user.roles as any);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException("No refresh token");
    let payload: { sub: string; companyId: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshTokenHash) throw new UnauthorizedException("Session expired");
    const valid = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!valid) throw new UnauthorizedException("Invalid refresh token");
    return this.rotateTokens(user.id, user.companyId, user.email, user.roles as any);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async forgotPassword(email: string, companySlug: string) {
    const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) return { ok: true };

    const user = await this.prisma.user.findFirst({
      where: { companyId: company.id, email: email.toLowerCase().trim() },
    });

    // Always return ok — don't reveal if email exists
    if (!user) return { ok: true };

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    await this.email.sendPasswordReset(user.email, user.name || "", token, companySlug);
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new UnauthorizedException("Invalid or expired reset link");

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null, failedLoginCount: 0, lockedUntil: null },
    });

    return { ok: true, message: "Password reset successfully. You can now log in." };
  }

  private async rotateTokens(userId: string, companyId: string, email: string, roles: Role[]) {
    const payload = { sub: userId, companyId, email, roles };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get("JWT_ACCESS_SECRET"),
      expiresIn: this.config.get<StringValue>("JWT_ACCESS_TTL", "15m"),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get<StringValue>("JWT_REFRESH_TTL", "7d"),
    });
    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } });
    return { accessToken, refreshToken, user: payload };
  }
}
