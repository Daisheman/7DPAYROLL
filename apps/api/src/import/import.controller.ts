import { Body, Controller, Get, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { ImportService } from "./import.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("import")
export class ImportController {
  constructor(private readonly imports: ImportService) {}

  @Post("employees/preview")
  @Roles("OWNER","ADMIN","HR_MANAGER","PAYROLL_PROCESSOR")
  @UseInterceptors(FileInterceptor("file"))
  previewEmployees(@UploadedFile() file: any) {
    if (!file?.buffer) throw new Error("No file uploaded");
    return this.imports.previewEmployees(file.buffer);
  }

  @Post("employees")
  @Roles("OWNER","ADMIN","HR_MANAGER")
  @UseInterceptors(FileInterceptor("file"))
  async importEmployees(@Req() req: any, @UploadedFile() file: any, @Body("confirm") confirm?: string, @Body("rows") rows?: string) {
    if (confirm === "true" && rows) {
      return this.imports.importEmployees(req.user.companyId, JSON.parse(rows));
    }
    if (!file?.buffer) throw new Error("No file uploaded");
    return this.imports.previewEmployees(file.buffer);
  }

  @Post("salary-history")
  @Roles("OWNER","ADMIN","HR_MANAGER","PAYROLL_MANAGER")
  @UseInterceptors(FileInterceptor("file"))
  importSalaryHistory(@Req() req: any, @UploadedFile() file: any) {
    if (!file?.buffer) throw new Error("No file uploaded");
    return this.imports.importSalaryHistory(req.user.companyId, req.user.sub ?? req.user.id, file.buffer);
  }

  @Post("timesheet/preview")
  @Roles("OWNER","ADMIN","PAYROLL_MANAGER","PAYROLL_PROCESSOR")
  @UseInterceptors(FileInterceptor("file"))
  previewTimesheet(@Req() req: any, @UploadedFile() file: any, @Body("sheet") sheetName?: string) {
    if (!file?.buffer) throw new Error("No file uploaded");
    return this.imports.previewAnySheet(req.user.companyId, file.buffer, sheetName);
  }

  @Post("timesheet/apply/:runId")
  @Roles("OWNER","ADMIN","PAYROLL_MANAGER","PAYROLL_PROCESSOR")
  async applyTimesheet(@Req() req: any, @Body("runId") runId: string, @Body("rows") rowsJson: string) {
    const rows = JSON.parse(rowsJson);
    return this.imports.applyTimesheetToRun(req.user.companyId, runId, rows);
  }

  // Legacy
  @Post("timesheet")
  @Roles("OWNER","ADMIN","PAYROLL_MANAGER","PAYROLL_PROCESSOR")
  @UseInterceptors(FileInterceptor("file"))
  legacyTimesheet(@Req() req: any, @UploadedFile() file: any) {
    if (!file?.buffer) throw new Error("No file uploaded");
    return this.imports.previewTimesheetInput(req.user.companyId, file.buffer);
  }

  @Post("payroll-sheet/preview")
  @Roles("OWNER","ADMIN","PAYROLL_MANAGER","PAYROLL_PROCESSOR")
  @UseInterceptors(FileInterceptor("file"))
  previewPayrollSheet(@Req() req: any, @UploadedFile() file: any, @Body("sheet") sheetName?: string) {
    if (!file?.buffer) throw new Error("No file uploaded");
    return this.imports.previewMonthlySheet(req.user.companyId, file.buffer, sheetName);
  }

  @Get("template")
  @Roles("OWNER","ADMIN","HR_MANAGER","PAYROLL_MANAGER","PAYROLL_PROCESSOR")
  async downloadTemplate(
    @Req() req: any,
    @Res() res: Response,
    @Query("month") month?: string,
    @Query("year") year?: string,
  ) {
    const buf = await this.imports.generateTimesheetTemplate(
      req.user.companyId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
    const m = month ?? String(new Date().getMonth() + 1);
    const y = year ?? String(new Date().getFullYear());
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="payroll-timesheet-template-${y}-${m}.xlsx"`);
    res.send(buf);
  }

  @Post("payroll-sheet/apply/:runId")
  @Roles("OWNER","ADMIN","PAYROLL_MANAGER","PAYROLL_PROCESSOR")
  async applyPayrollSheet(@Req() req: any, @Body("runId") runId: string, @Body("rows") rowsJson: string) {
    const rows = JSON.parse(rowsJson);
    return this.imports.applyTimesheetToRun(req.user.companyId, runId, rows);
  }
}
