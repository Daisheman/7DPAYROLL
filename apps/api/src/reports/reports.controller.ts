import { Controller, Get, Param, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Response, Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { ReportsService } from "./reports.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get("payroll-runs/:runId/employees/:employeeId/payslip.pdf")
  async payslip(@Req() req: Request, @Param("runId") runId: string, @Param("employeeId") employeeId: string, @Res() res: Response) {
    const cid = (req as any).user?.companyId;
    const pdf = await this.svc.payslipPdf(cid, runId, employeeId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="payslip-${employeeId}-${runId}.pdf"`);
    res.send(pdf);
  }

  @Get("payroll-runs/:runId/summary.xlsx")
  async summaryExcel(@Req() req: Request, @Param("runId") runId: string, @Res() res: Response) {
    const cid = (req as any).user?.companyId;
    const buf = await this.svc.payrollSummaryExcel(cid, runId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="payroll-summary-${runId}.xlsx"`);
    res.send(buf);
  }

  @Get("payroll-runs/:runId/nssf.xlsx")
  async nssfExcel(@Req() req: Request, @Param("runId") runId: string, @Res() res: Response) {
    const cid = (req as any).user?.companyId;
    const buf = await this.svc.nssfScheduleExcel(cid, runId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="nssf-schedule-${runId}.xlsx"`);
    res.send(buf);
  }

  @Get("p9a")
  async p9a(@Req() req: Request, @Query("year") year: string, @Res() res: Response) {
    const cid = (req as any).user?.companyId;
    const buf = await this.svc.p9AnnualExcel(cid, parseInt(year ?? new Date().getFullYear().toString()));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="p9a-${year}.xlsx"`);
    res.send(buf);
  }

  // ── Sage Guide Ch. 12: Bank payment file (CSV for bank upload) ──────────
  @Get("payroll-runs/:runId/bank-payment.csv")
  async bankPaymentCsv(@Req() req: Request, @Param("runId") runId: string, @Res() res: Response) {
    const cid = (req as any).user?.companyId;
    const csv = await this.svc.bankPaymentCsv(cid, runId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="bank-payment-${runId}.csv"`);
    res.send(csv);
  }
}
