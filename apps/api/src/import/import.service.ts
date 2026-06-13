import { BadRequestException, Injectable } from "@nestjs/common";
import { ContractType, EmploymentType } from "../prisma/prisma-enums";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../prisma/prisma.service";

export type ImportRow = {
  row: number; employeeNumber: string; fullName: string;
  employmentType: EmploymentType; title?: string; contractType: ContractType;
  baseSalary: number; hourlyRate?: number; stdHoursPerMonth?: number;
  housingAllowance?: number; transportAllowance?: number; siteAllowance?: number;
  standbyDailyRate?: number; startDate: string; endDate?: string;
  nationality?: string; currency: string; usdSalary?: number;
  leaveBalanceDays?: number; notes?: string; errors: string[];
};

export type TimesheetRow = {
  seq: number; employeeCode: string; employeeName: string; payType: string;
  actualHours: number; otHours: number; ot20Hours: number; phHours: number;
  standbyDays: number; callout15Hours: number; callout20Hours: number;
  otherDeductions: number; adjustments: number; leaveTaken?: number;
  employeeId?: string; matched: boolean; errors: string[];
};

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Employee Setup Import ────────────────────────────────────────────────
  // Reads the "Employee Setup" sheet (or first sheet). Data starts at row 8+
  // Col A=seq, B=name, C=code, D=payType, E=title, F=contractType
  // Col G=fixedSalaryTzs, H=hourlyRate, I=stdHours
  // Col J=housing, K=transport, L=site, M=startDate, N=nationality
  // Col O=notes, P=currency, Q=usdSalary, R=endDate, S=leaveBalance, T=standbyRate
  async previewEmployees(buffer: Buffer): Promise<ImportRow[]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as any);
    const sheet = wb.getWorksheet("Employee Setup") ?? wb.worksheets[0];
    if (!sheet) throw new BadRequestException("No worksheet found");

    // Find data start row (seq number in col A, name in col B)
    let startRow = 8;
    for (let r = 5; r <= 15; r++) {
      const a = sheet.getRow(r).getCell(1).value;
      const b = sheet.getRow(r).getCell(2).value;
      if (typeof a === "number" && typeof b === "string" && b.trim().length > 1) {
        startRow = r; break;
      }
    }

    const rows: ImportRow[] = [];
    for (let rn = startRow; rn <= sheet.rowCount; rn++) {
      const row = sheet.getRow(rn);
      const name = String(row.getCell(2).value ?? "").trim();
      if (!name || name.toLowerCase().startsWith("total")) break;

      const currency = String(row.getCell(16).value ?? "TZS").trim().toUpperCase() || "TZS";
      const usdSalary = this.num(row.getCell(17).value);
      const fixedTzs = this.num(row.getCell(7).value);
      const et = String(row.getCell(4).value ?? "FIXED").trim().toUpperCase() as EmploymentType;

      const imported: ImportRow = {
        row: rn, fullName: name,
        employeeNumber: String(row.getCell(3).value ?? "").trim(),
        employmentType: et,
        title: this.str(row.getCell(5).value),
        contractType: (this.str(row.getCell(6).value) || "Citizen") as ContractType,
        baseSalary: currency === "USD" && usdSalary ? usdSalary * 2600 : fixedTzs,
        hourlyRate: this.numOpt(row.getCell(8).value),
        stdHoursPerMonth: this.numOpt(row.getCell(9).value),
        housingAllowance: this.numOpt(row.getCell(10).value),
        transportAllowance: this.numOpt(row.getCell(11).value),
        siteAllowance: this.numOpt(row.getCell(12).value),
        startDate: this.excelDate(row.getCell(13).value),
        nationality: this.str(row.getCell(14).value),
        notes: this.str(row.getCell(15).value),
        currency,
        usdSalary: usdSalary || undefined,
        endDate: row.getCell(18).value ? this.excelDate(row.getCell(18).value) : undefined,
        leaveBalanceDays: this.numOpt(row.getCell(19).value),
        standbyDailyRate: this.numOpt(row.getCell(20).value),
        errors: [],
      };

      if (!imported.employeeNumber) imported.errors.push("Employee code missing");
      if (!["FIXED","HOURLY","DAILY"].includes(imported.employmentType))
        imported.errors.push(`Unknown pay type: ${imported.employmentType}`);
      rows.push(imported);
    }

    if (!rows.length) throw new BadRequestException("No employee data found. Check file format.");
    return rows;
  }

  async importEmployees(companyId: string, rows: ImportRow[]) {
    const valid = rows.filter((r) => !r.errors.length);
    if (!valid.length) throw new BadRequestException("No valid rows to import");

    let created = 0, updated = 0;
    for (const row of valid) {
      const [firstName, ...rest] = row.fullName.split(" ");
      const data: any = {
        fullName: row.fullName, firstName, lastName: rest.join(" ") || firstName,
        title: row.title, contractType: row.contractType, employmentType: row.employmentType,
        baseSalary: row.baseSalary, hourlyRate: row.hourlyRate, stdHoursPerMonth: row.stdHoursPerMonth,
        housingAllowance: row.housingAllowance, transportAllowance: row.transportAllowance,
        siteAllowance: row.siteAllowance, standbyDailyRate: row.standbyDailyRate,
        startDate: new Date(row.startDate), nationality: row.nationality, notes: row.notes,
        currency: row.currency, usdSalary: row.usdSalary, isActive: true,
        endDate: row.endDate ? new Date(row.endDate) : null,
      };

      const existing = await this.prisma.employee.findFirst({
        where: { companyId, employeeNumber: row.employeeNumber },
      });

      if (existing) {
        await (this.prisma.employee as any).update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await (this.prisma.employee as any).create({
          data: { ...data, companyId, employeeNumber: row.employeeNumber },
        });
        created++;
      }
    }
    return { created, updated, total: rows.length, skipped: rows.length - valid.length };
  }

  // ── Salary History Import ────────────────────────────────────────────────
  // Reads "Salary History" sheet. Row 7+ = data.
  // Col A=seq, B=name, C=code, D=effectiveDate, E=payType
  // Col F=fixedSalaryTzs, G=hourlyRate, H=stdHours, I=currency, J=usdSalary, K=exchangeRate, L=reason
  async importSalaryHistory(companyId: string, actorId: string, buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as any);
    const sheet = wb.getWorksheet("Salary History") ?? wb.worksheets[0];
    if (!sheet) throw new BadRequestException("Salary History sheet not found");

    let startRow = 7;
    for (let r = 5; r <= 12; r++) {
      const a = sheet.getRow(r).getCell(1).value;
      const b = sheet.getRow(r).getCell(2).value;
      if (typeof a === "number" && typeof b === "string" && b.trim().length > 1) {
        startRow = r; break;
      }
    }

    let imported = 0;
    for (let rn = startRow; rn <= sheet.rowCount; rn++) {
      const row = sheet.getRow(rn);
      const name = this.str(row.getCell(2).value);
      if (!name) break;

      const code = this.str(row.getCell(3).value);
      const emp = await this.prisma.employee.findFirst({ where: { companyId, employeeNumber: code } });
      if (!emp) continue;

      const effDate = this.excelDate(row.getCell(4).value);
      const currency = this.str(row.getCell(9).value) || "TZS";
      const usdSalary = this.numOpt(row.getCell(10).value);
      const fixedTzs = this.numOpt(row.getCell(6).value);

      // Check if this record already exists (idempotent)
      const exists = await (this.prisma.salaryHistory as any).findFirst({
        where: { companyId, employeeId: emp.id, effectiveDate: new Date(effDate) },
      });
      if (exists) continue;

      await (this.prisma.salaryHistory as any).create({
        data: {
          companyId, employeeId: emp.id,
          effectiveDate: new Date(effDate),
          payType: String(row.getCell(5).value ?? "FIXED").trim().toUpperCase(),
          fixedSalaryTzs: currency === "USD" && usdSalary ? usdSalary * this.num(row.getCell(11).value || 2600) : fixedTzs,
          hourlyRateTzs: this.numOpt(row.getCell(7).value),
          stdHoursPerMonth: this.numOpt(row.getCell(8).value),
          currency,
          usdSalary: usdSalary || undefined,
          exchangeRate: this.numOpt(row.getCell(11).value),
          reason: this.str(row.getCell(12).value),
          createdBy: actorId,
        },
      });
      imported++;
    }
    return { imported };
  }

  // ── Timesheet Input Import ───────────────────────────────────────────────
  // Reads the "Timesheet Input" sheet (single input sheet format)
  // Row 4 = payroll month, Row 5+ = headers, Row 7+ = data
  // Col A=seq, B=name, C=code, D=dayHrs, E=ot15Hrs, F=ot20Hrs, G=phHrs
  // Col H=contractHrs, I=variance, J=otherDeductions, K=notes
  // Col L=standbyDays, M=callout15Hrs, N=callout20Hrs
  async previewTimesheetInput(companyId: string, buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as any);

    // Try "Timesheet Input" sheet first
    const sheet = wb.getWorksheet("Timesheet Input") ?? wb.worksheets.find(
      (ws) => ws.name.toLowerCase().includes("timesheet")
    ) ?? wb.worksheets[0];
    if (!sheet) throw new BadRequestException("Timesheet Input sheet not found");

    // Read payroll month from row 4
    const monthCell = sheet.getRow(4).getCell(2).value;
    const monthStr = String(monthCell ?? "").trim();

    // Parse month/year
    const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();
    const mLower = monthStr.toLowerCase();
    const mIdx = months.findIndex((m) => mLower.includes(m));
    if (mIdx >= 0) month = mIdx + 1;
    const yMatch = monthStr.match(/20\d\d/);
    if (yMatch) year = parseInt(yMatch[0]);

    // Find data start row
    let startRow = 7;
    for (let r = 5; r <= 12; r++) {
      const a = sheet.getRow(r).getCell(1).value;
      const b = sheet.getRow(r).getCell(2).value;
      if (typeof a === "number" && typeof b === "string" && b.trim().length > 1) {
        startRow = r; break;
      }
    }

    const employees = await this.prisma.employee.findMany({
      where: { companyId, isActive: true },
    });

    const rows: TimesheetRow[] = [];
    for (let rn = startRow; rn <= sheet.rowCount; rn++) {
      const row = sheet.getRow(rn);
      const seq = row.getCell(1).value;
      const name = this.str(row.getCell(2).value);
      if (!name || name.toLowerCase() === "totals") break;

      const code = this.str(row.getCell(3).value);
      const emp = employees.find((e) =>
        e.employeeNumber.toLowerCase() === code.toLowerCase() ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(name.toLowerCase().split(" ")[0].toLowerCase())
      );

      rows.push({
        seq: Number(seq) || rn - startRow + 1,
        employeeCode: code, employeeName: name,
        payType: emp?.employmentType ?? "HOURLY",
        actualHours:    this.num(row.getCell(4).value),   // Day Hrs
        otHours:        this.num(row.getCell(5).value),   // OT 1.5×
        ot20Hours:      this.num(row.getCell(6).value),   // OT 2.0×
        phHours:        this.num(row.getCell(7).value),   // PH 2.0×
        standbyDays:    this.num(row.getCell(12).value),  // Standby days
        callout15Hours: this.num(row.getCell(13).value),  // Callout 1.5×
        callout20Hours: this.num(row.getCell(14).value),  // Callout 2.0×
        otherDeductions:this.num(row.getCell(10).value),  // Other deductions
        adjustments:    0,
        employeeId: emp?.id,
        matched: !!emp,
        errors: emp ? [] : [`Employee not found: "${code}"`],
      });
    }

    return { month, year, sheetName: sheet.name, rows, matchedCount: rows.filter((r) => r.matched).length };
  }

  async applyTimesheetToRun(companyId: string, runId: string, rows: TimesheetRow[]) {
    let applied = 0;
    for (const row of rows.filter((r) => r.matched && r.employeeId)) {
      const line = await this.prisma.payrollItem.findFirst({
        where: { companyId, payrollRunId: runId, employeeId: row.employeeId! },
      });
      if (!line) continue;

      await (this.prisma.payrollItem as any).update({
        where: { id: line.id },
        data: {
          actualHours:     row.actualHours || undefined,
          otHours:         row.otHours,
          ot20Hours:       row.ot20Hours,
          phHours:         row.phHours,
          standbyDays:     row.standbyDays,
          callout15Hours:  row.callout15Hours,
          callout20Hours:  row.callout20Hours,
          otherDeductions: row.otherDeductions,
          adjustments:     row.adjustments,
        },
      });
      applied++;
    }
    return { applied, total: rows.filter((r) => r.matched).length };
  }

  // ── Monthly Payroll Sheet Import ─────────────────────────────────────────
  // Reads a named monthly sheet (e.g. "March") from the master spreadsheet
  async previewMonthlySheet(companyId: string, buffer: Buffer, sheetName?: string) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as any);

    let sheet: ExcelJS.Worksheet | undefined;
    if (sheetName) {
      sheet = wb.getWorksheet(sheetName);
    } else {
      const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
      for (const ws of wb.worksheets) {
        if (monthNames.some((m) => ws.name.toLowerCase() === m || ws.name.toLowerCase().startsWith(m))) {
          sheet = ws; break;
        }
      }
    }
    if (!sheet) {
      // List available sheets for the user
      const available = wb.worksheets.map((ws) => ws.name).join(", ");
      throw new BadRequestException(`Monthly sheet not found. Available sheets: ${available}`);
    }

    // Read header rows
    const row3 = sheet.getRow(3);
    const row4 = sheet.getRow(4);
    const workingDays = this.num(row3.getCell(4).value) || 26;
    const exchangeRate = this.num(row4.getCell(6).value) || 2600;
    const deductionsStr = String(row3.getCell(20).value ?? "ON").toUpperCase().trim();
    const deductionsActive = !["OFF","0","FALSE","NO"].includes(deductionsStr);

    // Parse period from title row 1
    const title = String(sheet.getRow(1).getCell(1).value ?? "");
    const sheetNameLower = sheet.name.toLowerCase();
    const monthIdx = ["january","february","march","april","may","june","july","august","september","october","november","december"]
      .findIndex((m) => sheetNameLower.includes(m));
    const month = monthIdx >= 0 ? monthIdx + 1 : new Date().getMonth() + 1;
    const yMatch = title.match(/20\d\d/);
    const year = yMatch ? parseInt(yMatch[0]) : new Date().getFullYear();

    // Find data start row
    let startRow = 9;
    for (let r = 7; r <= 15; r++) {
      const a = sheet.getRow(r).getCell(1).value;
      const c = sheet.getRow(r).getCell(3).value;
      if (typeof a === "number" && typeof c === "string") { startRow = r; break; }
    }

    const employees = await this.prisma.employee.findMany({ where: { companyId, isActive: true } });
    const rows: TimesheetRow[] = [];

    for (let rn = startRow; rn <= sheet.rowCount; rn++) {
      const row = sheet.getRow(rn);
      const seq = row.getCell(1).value;
      const name = this.str(row.getCell(2).value);
      if (!name || typeof seq !== "number") continue;

      const code = this.str(row.getCell(3).value);
      const emp = employees.find((e) =>
        e.employeeNumber.toLowerCase() === code.toLowerCase()
      );

      rows.push({
        seq: Number(seq),
        employeeCode: code, employeeName: name,
        payType: String(row.getCell(4).value ?? "").toUpperCase(),
        actualHours:     this.num(row.getCell(7).value),   // Col G
        otHours:         this.num(row.getCell(10).value),  // Col J: OT 1.5× hours
        ot20Hours:       this.num(row.getCell(12).value),  // Col L: OT 2.0× hours
        phHours:         this.num(row.getCell(14).value),  // Col N: PH 2.0× hours
        standbyDays:     this.num(row.getCell(16).value),  // Col P: Standby days
        callout15Hours:  this.num(row.getCell(18).value),  // Col R: Callout 1.5×
        callout20Hours:  this.num(row.getCell(20).value),  // Col T: Callout 2.0×
        otherDeductions: this.num(row.getCell(28).value),  // Col AB
        adjustments:     this.num(row.getCell(30).value),  // Col AD
        leaveTaken:      this.numOpt(row.getCell(37).value), // Col AK: leave taken
        employeeId: emp?.id,
        matched: !!emp,
        errors: emp ? [] : [`No employee with code "${code}"`],
      });
    }

    return {
      month, year, sheetName: sheet.name, workingDays, exchangeRate, deductionsActive,
      availableSheets: wb.worksheets.map((ws) => ws.name),
      matchedCount: rows.filter((r) => r.matched).length,
      unmatchedCount: rows.filter((r) => !r.matched).length,
      rows,
    };
  }

  // Unified: detect sheet type and route to correct parser
  async previewAnySheet(companyId: string, buffer: Buffer, sheetName?: string) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as any);

    const availableSheets = wb.worksheets.map((ws) => ws.name);
    const targetSheet = sheetName ? wb.getWorksheet(sheetName) : undefined;
    const targetName = targetSheet?.name ?? sheetName ?? "";

    // Detect sheet type
    if (targetName.toLowerCase().includes("timesheet") || 
        availableSheets.some((s) => s.toLowerCase().includes("timesheet input"))) {
      // If the file has a "Timesheet Input" sheet, use that
      const hasTimesheetInput = availableSheets.some((s) => s === "Timesheet Input");
      if (hasTimesheetInput || targetName.toLowerCase().includes("timesheet")) {
        return { type: "timesheet", ...(await this.previewTimesheetInput(companyId, buffer)) };
      }
    }

    // Otherwise treat as monthly payroll sheet
    return { type: "monthly", ...(await this.previewMonthlySheet(companyId, buffer, sheetName)) };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private num(v: unknown): number { return Number(v ?? 0) || 0; }
  private numOpt(v: unknown): number | undefined { const n = Number(v ?? 0); return n || undefined; }
  private str(v: unknown): string { return String(v ?? "").trim(); }
  private excelDate(value: unknown): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
    if (typeof value === "number") return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString();
    const d = new Date(String(value));
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  // ── Payroll Timesheet Template Generator ─────────────────────────────────
  async generateTimesheetTemplate(companyId: string, month?: number, year?: number): Promise<Buffer> {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, isActive: true },
      orderBy: { employeeNumber: "asc" },
    });
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const monthName = monthNames[m - 1];

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(monthName);

    // ── Header rows ──────────────────────────────────────────────────────────
    ws.getRow(1).getCell(1).value = `7D Minerals Payroll — ${monthName} ${y}`;
    ws.getRow(1).getCell(1).font = { bold: true, size: 14 };

    ws.getRow(3).getCell(1).value = "Working Days:";
    ws.getRow(3).getCell(4).value = 26;                  // Col D — working days
    ws.getRow(3).getCell(19).value = "Deductions:";
    ws.getRow(3).getCell(20).value = "ON";               // Col T — deductions flag

    ws.getRow(4).getCell(1).value = "Exchange Rate (TZS/USD):";
    ws.getRow(4).getCell(6).value = 2600;                // Col F — exchange rate

    // ── Column headers row 7 ─────────────────────────────────────────────────
    const headers = [
      "SEQ","EMPLOYEE NAME","CODE","PAY TYPE","","","ACT HRS","","","OT 1.5x","","OT 2.0x",
      "","PH 2.0x","","STANDBY","","CALLOUT 1.5x","","CALLOUT 2.0x","","","","","","","","OTHER DED","","ADJ",
      "","","","","","","LEAVE DAYS"
    ];
    const hRow = ws.getRow(7);
    headers.forEach((h, i) => { hRow.getCell(i + 1).value = h; });
    hRow.font = { bold: true };
    hRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    hRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Column widths
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 25;
    ws.getColumn(3).width = 12;
    ws.getColumn(4).width = 10;
    ws.getColumn(7).width = 10;  // Act hrs
    ws.getColumn(10).width = 10; // OT 1.5x
    ws.getColumn(12).width = 10; // OT 2.0x
    ws.getColumn(14).width = 10; // PH
    ws.getColumn(16).width = 10; // Standby
    ws.getColumn(18).width = 12; // Callout 1.5x
    ws.getColumn(20).width = 12; // Callout 2.0x
    ws.getColumn(28).width = 14; // Other ded
    ws.getColumn(30).width = 12; // Adjustments
    ws.getColumn(37).width = 12; // Leave days

    // ── Data rows starting at row 9 ──────────────────────────────────────────
    employees.forEach((emp, idx) => {
      const rn = 9 + idx;
      const row = ws.getRow(rn);
      row.getCell(1).value = idx + 1;              // Col A: seq
      row.getCell(2).value = emp.fullName ?? `${emp.firstName} ${emp.lastName}`; // Col B: name
      row.getCell(3).value = emp.employeeNumber;   // Col C: code
      row.getCell(4).value = emp.employmentType;   // Col D: pay type
      // Hourly employees: leave Col G (Act Hrs) blank for user to fill in
      // Fixed employees: Col G can stay blank (not used)
      if (emp.employmentType === "HOURLY") {
        row.getCell(7).value = 0;                  // Col G: actual hours (start at 0)
        row.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
      }
      // Highlight the other input cells
      [10, 12, 14, 16, 18, 20, 28, 30, 37].forEach((col) => {
        row.getCell(col).value = 0;
        row.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
      });
    });

    // ── Notes sheet ──────────────────────────────────────────────────────────
    const notes = wb.addWorksheet("Instructions");
    notes.getRow(1).getCell(1).value = "HOW TO USE THIS TEMPLATE";
    notes.getRow(1).getCell(1).font = { bold: true, size: 12 };
    const instructions = [
      ["", ""],
      ["Sheet name:", `"${monthName}" — DO NOT rename this sheet`],
      ["Row 3, Col D:", "Working days for this month"],
      ["Row 4, Col F:", "TZS/USD exchange rate"],
      ["Row 3, Col T:", "Deductions: ON or OFF"],
      ["", ""],
      ["DATA COLUMNS (starting row 9):",""],
      ["Col A:", "Sequence number (auto-filled)"],
      ["Col B:", "Employee full name"],
      ["Col C:", "Employee code — MUST match exactly"],
      ["Col D:", "Pay type — HOURLY or FIXED"],
      ["Col G:", "Actual hours worked (HOURLY only)"],
      ["Col J:", "OT 1.5× hours"],
      ["Col L:", "OT 2.0× hours"],
      ["Col N:", "Public Holiday 2.0× hours"],
      ["Col P:", "Standby days"],
      ["Col R:", "Callout 1.5× hours"],
      ["Col T:", "Callout 2.0× hours"],
      ["Col AB:", "Other deductions (TZS amount)"],
      ["Col AD:", "Adjustments (positive = addition, negative = deduction)"],
      ["Col AK:", "Leave days taken this month"],
    ];
    instructions.forEach(([a, b], i) => {
      notes.getRow(i + 2).getCell(1).value = a;
      notes.getRow(i + 2).getCell(2).value = b;
    });
    notes.getColumn(1).width = 30;
    notes.getColumn(2).width = 50;

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
