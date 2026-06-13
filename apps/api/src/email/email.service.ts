import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get("SMTP_HOST", "mail.the7dcloud.com"),
      port: Number(config.get("SMTP_PORT", "465")),
      secure: config.get("SMTP_SECURE", "true") === "true",
      auth: {
        user: config.get("SMTP_USER", "admin@the7dcloud.com"),
        pass: config.get("SMTP_PASS"),
      },
      tls: { rejectUnauthorized: false },
    });
  }

  private get from() {
    return this.config.get("SMTP_FROM", "7D Global Projects Payroll <admin@the7dcloud.com>");
  }
  private get appUrl() {
    return this.config.get("APP_URL", "https://payroll.the7dcloud.com");
  }

  async sendPasswordReset(to: string, name: string, token: string, companySlug: string) {
    const link = `${this.appUrl}/reset-password?token=${token}&company=${companySlug}`;
    try {
      await this.transporter.sendMail({
        from: this.from, to,
        subject: "Reset your password — 7D Global Projects Payroll",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#BE185D;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">7D Global Projects Payroll</h1></div>
          <div style="padding:32px">
            <h2 style="color:#111827">Password Reset Request</h2>
            <p style="color:#374151">Hi ${name || "there"},</p>
            <p style="color:#374151">Click below to reset your password. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align:center;margin:32px 0"><a href="${link}" style="background:#BE185D;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600">Reset Password</a></div>
            <p style="color:#6B7280;font-size:13px">If you did not request this, ignore this email.</p>
            <p style="color:#6B7280;font-size:13px">Link: <a href="${link}" style="color:#BE185D">${link}</a></p>
          </div>
          <div style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB"><p style="color:#9CA3AF;font-size:12px;margin:0">7D Global Projects · payroll.the7dcloud.com</p></div>
        </div>`,
      });
      this.logger.log(`Password reset sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset to ${to}: ${(err as Error).message}`);
    }
  }

  async sendWelcome(to: string, name: string, companyName: string, companySlug: string, tempPassword: string) {
    const loginUrl = `${this.appUrl}/login?company=${companySlug}`;
    try {
      await this.transporter.sendMail({
        from: this.from, to,
        subject: `Your ${companyName} Payroll account is ready`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#BE185D;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">7D Global Projects Payroll</h1></div>
          <div style="padding:32px">
            <h2 style="color:#111827">Welcome to ${companyName} Payroll</h2>
            <p style="color:#374151">Hi ${name || "there"},</p>
            <p style="color:#374151">Your account has been created:</p>
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:20px;margin:24px 0">
              <p style="margin:0 0 8px;color:#374151"><strong>Login URL:</strong> <a href="${loginUrl}" style="color:#BE185D">${loginUrl}</a></p>
              <p style="margin:0 0 8px;color:#374151"><strong>Email:</strong> ${to}</p>
              <p style="margin:0;color:#374151"><strong>Temp Password:</strong> <code style="background:#fff;padding:2px 6px;border-radius:3px;border:1px solid #E5E7EB">${tempPassword}</code></p>
            </div>
            <p style="color:#374151">Please log in and change your password immediately.</p>
            <div style="text-align:center;margin:24px 0"><a href="${loginUrl}" style="background:#BE185D;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600">Log In Now</a></div>
          </div>
          <div style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB"><p style="color:#9CA3AF;font-size:12px;margin:0">7D Global Projects · payroll.the7dcloud.com</p></div>
        </div>`,
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send welcome email to ${to}: ${(err as Error).message}`);
    }
  }

  async sendPayrollApproved(to: string, name: string, companyName: string, period: string, companySlug: string) {
    const loginUrl = `${this.appUrl}/login?company=${companySlug}`;
    try {
      await this.transporter.sendMail({
        from: this.from, to,
        subject: `Payroll Approved — ${period} · ${companyName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#BE185D;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">7D Global Projects Payroll</h1></div>
          <div style="padding:32px">
            <h2 style="color:#111827">Payroll Approved</h2>
            <p style="color:#374151">Hi ${name || "there"},</p>
            <p style="color:#374151">The <strong>${period}</strong> payroll for <strong>${companyName}</strong> has been approved and is ready for payment.</p>
            <div style="text-align:center;margin:24px 0"><a href="${loginUrl}" style="background:#BE185D;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600">View Payroll</a></div>
          </div>
          <div style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB"><p style="color:#9CA3AF;font-size:12px;margin:0">7D Global Projects · payroll.the7dcloud.com</p></div>
        </div>`,
      });
      this.logger.log(`Payroll approved email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send payroll approved email: ${(err as Error).message}`);
    }
  }
}
