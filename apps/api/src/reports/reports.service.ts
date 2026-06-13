import { Injectable, NotFoundException } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import PDFDocument = require("pdfkit");
import { PrismaService } from "../prisma/prisma.service";
import { COUNTRY_CONFIGS } from "@payroll/schemas";

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRun(companyId: string, payrollRunId: string) {
    return this.prisma.payrollRun.findFirstOrThrow({
      where: { companyId, id: payrollRunId },
      include: {
        items: {
          include: { employee: true },
          orderBy: { employee: { firstName: "asc" } },
        },
        company: { include: { settings: true } },
      },
    });
  }

  async payslipPdf(companyId: string, payrollRunId: string, employeeId: string): Promise<Buffer> {
    const run = await this.getRun(companyId, payrollRunId);
    const item = run.items.find((i) => i.employeeId === employeeId);
    if (!item) throw new NotFoundException("Payslip not found");

    const company = run.company;
    const emp = item.employee;
    const country = (company.country ?? "TZ") as any;
    const config = COUNTRY_CONFIGS[country as "TZ"] ?? COUNTRY_CONFIGS["TZ"];
    const currency = (company as any).baseCurrency ?? (company as any).taxCurrency ?? (company as any).settings?.statutoryCurrency ?? "TZS";
    const isDeductionsSuspended = !((run as any).deductionsActive);
    const monthName = new Date(run.periodYear, run.periodMonth - 1, 1)
      .toLocaleString("en-US", { month: "long", year: "numeric" });

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    const W = 515; // usable width
    const col2 = 300; // right column start

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(40, 40, W, 60).fill("#0f766e");
    doc.fillColor("white").fontSize(20).font("Helvetica-Bold")
       .text("PAYSLIP", 50, 52, { width: W - 20 });
    doc.fontSize(10).font("Helvetica")
       .text(company.name, 50, 75)
       .text(monthName, col2, 75, { width: W - col2 + 40, align: "right" });

    doc.fillColor("#111827");
    let y = 115;

    // ── Company + Employee info ──────────────────────────────────────────────
    doc.rect(40, y, W, 1).fill("#d9e0ea");
    y += 8;

    const infoLeft = [
      ["Company", company.name],
      ["Country", country],
      ["Contract", (company as any).contract ?? "—"],
      ["Tax Year", company.taxYear ?? "2025/26"],
    ];
    const infoRight = [
      ["Employee", emp.fullName ?? `${emp.firstName} ${emp.lastName}`],
      ["Code", emp.employeeNumber],
      ["Title", emp.title ?? "—"],
      ["Start Date", new Date(emp.startDate).toLocaleDateString("en-GB")],
    ];
    doc.fontSize(9).font("Helvetica");
    infoLeft.forEach(([label, value], i) => {
      const row = y + i * 14;
      doc.fillColor("#64748b").text(label, 50, row, { width: 100 });
      doc.fillColor("#111827").text(value ?? "—", 155, row, { width: 140 });
    });
    infoRight.forEach(([label, value], i) => {
      const row = y + i * 14;
      doc.fillColor("#64748b").text(label, col2, row, { width: 80 });
      doc.fillColor("#111827").text(value ?? "—", col2 + 85, row, { width: 130 });
    });

    y += 70;

    // Pay type / working days row
    const metaItems = [
      ["Pay Type",      emp.employmentType],
      ["Working Days",  String(run.workingDays)],
      ["Exchange Rate", run.exchangeRate ? `${fmt(Number(run.exchangeRate))} ${currency}/USD` : "N/A"],
      ["Status",        run.status],
    ];
    doc.rect(40, y, W, 18).fill("#f7f8fb");
    metaItems.forEach(([label, value], i) => {
      const x = 50 + i * 128;
      doc.fillColor("#64748b").fontSize(8).text(label, x, y + 3, { width: 60 });
      doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold").text(value, x + 62, y + 3, { width: 60 });
    });
    doc.font("Helvetica");
    y += 25;

    // ── Deductions suspended warning ─────────────────────────────────────────
    if (isDeductionsSuspended) {
      doc.rect(40, y, W, 20).fill("#fef3c7");
      doc.fillColor("#92400e").fontSize(9).font("Helvetica-Bold")
         .text("⚠ STATUTORY DEDUCTIONS SUSPENDED — Net Pay equals Gross Pay for this period", 50, y + 5, { width: W - 20 });
      doc.font("Helvetica").fillColor("#111827");
      y += 26;
    }

    // ── Section helper ───────────────────────────────────────────────────────
    const section = (title: string) => {
      doc.rect(40, y, W, 16).fill("#0f766e");
      doc.fillColor("white").fontSize(9).font("Helvetica-Bold").text(title, 50, y + 3);
      doc.fillColor("#111827").font("Helvetica");
      y += 20;
    };

    const row = (label: string, amount: number, bold = false, indent = 0) => {
      if (amount === 0 && !bold) return; // skip zero rows
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      doc.fillColor("#111827").text(label, 50 + indent, y, { width: W - 120 });
      doc.text(`${currency} ${fmt(amount)}`, 50, y, { width: W - 10, align: "right" });
      y += 13;
    };

    const divider = () => {
      doc.rect(40, y, W, 0.5).fill("#d9e0ea");
      y += 4;
    };

    // ── Earnings ────────────────────────────────────────────────────────────
    section("EARNINGS");
    row("Basic Pay",           Number(item.basicPay));
    row("OT 1.5× Pay",         Number(item.otPay));
    row("OT 2.0× Pay",         Number((item as any).ot20Pay ?? 0));
    row("Public Holiday 2.0×", Number(item.phPay));
    row("Standby Pay",         Number((item as any).standbyPay ?? 0));
    row("Callout 1.5× Pay",   Number((item as any).callout15Pay ?? 0));
    row("Callout 2.0× Pay",   Number((item as any).callout20Pay ?? 0));
    row("Housing Allowance",   Number(emp.housingAllowance ?? 0));
    row("Transport Allowance", Number(emp.transportAllowance ?? 0));
    row("Site Allowance",      Number(emp.siteAllowance ?? 0));
    row("Bonus / Other",       Number((item as any).bonus ?? 0) + Number(item.otherAdditions));
    divider();
    row("GROSS PAY", Number(item.grossPay), true);
    y += 4;

    // ── Deductions ──────────────────────────────────────────────────────────
    section("DEDUCTIONS");
    row(`${config.pensionLabel} (Employee)`, Number(item.nssfEmployee));
    row("PAYE", Number(item.paye));
    if (Number(item.sdl) > 0) row("SDL", Number(item.sdl));
    if (Number(item.wcf) > 0) row("WCF", Number(item.wcf));
    if (Number((item as any).levy ?? 0) > 0) row("Levy", Number((item as any).levy));
    row("Other Deductions", Number(item.otherDeductions));
    if (Number(item.adjustments) !== 0) row("Adjustments", Number(item.adjustments));
    divider();
    const totalDeductions = Number(item.nssfEmployee) + Number(item.paye) + Number(item.otherDeductions);
    row("TOTAL DEDUCTIONS", totalDeductions, true);
    y += 4;

    // ── Net Pay ──────────────────────────────────────────────────────────────
    doc.rect(40, y, W, 24).fill("#0f766e");
    doc.fillColor("white").fontSize(13).font("Helvetica-Bold")
       .text("NET PAY", 50, y + 5)
       .text(`${currency} ${fmt(Number(item.netPay))}`, 50, y + 5, { width: W - 10, align: "right" });
    doc.fillColor("#111827").font("Helvetica");
    y += 32;

    // ── YTD (only for locked runs) ────────────────────────────────────────
    if (run.status === "LOCKED") {
      section("YEAR TO DATE");
      row("YTD Gross",  Number(item.ytdGross));
      row("YTD PAYE",   Number(item.ytdPaye));
      row(`YTD ${config.pensionLabel}`, Number((item as any).ytdNssf ?? 0));
      row("YTD Net",    Number((item as any).ytdNet ?? 0));
      y += 4;
    }

    // ── Employer costs ───────────────────────────────────────────────────────
    section("EMPLOYER COSTS (informational)");
    row(`${config.pensionLabel} (Employer)`, Number(item.nssfEmployer));
    if (Number(item.sdl) > 0) row("SDL",  Number(item.sdl));
    if (Number(item.wcf) > 0) row("WCF",  Number(item.wcf));
    if (Number((item as any).levy ?? 0) > 0) row("Levy", Number((item as any).levy));
    divider();
    row("TOTAL EMPLOYER COST", Number(item.totalEmployerCost), true);
    y += 8;

    // ── Footer ────────────────────────────────────────────────────────────
    doc.rect(40, y, W, 0.5).fill("#d9e0ea");
    y += 6;
    doc.fontSize(8).fillColor("#64748b")
       .text("Profacc Business Services | P.O. Box 3066, Francistown, Botswana | +267 72118946", 40, y, {
         width: W,
         align: "center",
       });
    y += 16;

    // Signature lines
    const sig = (label: string, x: number) => {
      doc.rect(x, y, 160, 0.5).fill("#111827");
      doc.fontSize(8).fillColor("#64748b").text(label, x, y + 4, { width: 160, align: "center" });
    };
    sig("Authorised Signatory", 50);
    sig("Employee Acknowledgement", 310);

    doc.end();
    return done;
  }

  async payrollSummaryExcel(companyId: string, payrollRunId: string): Promise<Buffer> {
    const run = await this.getRun(companyId, payrollRunId);
    const company = run.company;
    const currency = (company as any).baseCurrency ?? (company as any).taxCurrency ?? (company as any).settings?.statutoryCurrency ?? "TZS";
    const monthName = new Date(run.periodYear, run.periodMonth - 1, 1)
      .toLocaleString("en-US", { month: "long", year: "numeric" });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Profacc Payroll";
    wb.created = new Date();

    const ws = wb.addWorksheet("Payroll Summary");

    // Header rows
    ws.mergeCells("A1:N1");
    ws.getCell("A1").value = `${company.name} — Payroll Summary ${monthName}`;
    ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    ws.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    ws.getCell("A1").alignment = { horizontal: "center" };

    const headers = [
      "Code", "Employee", "Pay Type", "Currency",
      "Basic Pay", "OT Pay", "PH Pay", "Bonus", "Gross Pay",
      `${COUNTRY_CONFIGS[(company.country ?? "TZ") as "TZ"]?.pensionLabel ?? "NSSF"} EE`,
      "PAYE", "SDL", "Net Pay", "Total Employer Cost",
    ];

    ws.addRow([]); // blank row 2
    const hrow = ws.addRow(headers);
    hrow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    hrow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
      cell.alignment = { horizontal: "center" };
    });

    const numFmt = `#,##0`;
    ws.columns = [
      { width: 12 }, { width: 28 }, { width: 10 }, { width: 8 },
      { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 },
      { width: 14 }, { width: 14 }, { width: 12 }, { width: 16 }, { width: 18 },
    ];

    run.items.forEach((item) => {
      const r = ws.addRow([
        item.employee.employeeNumber,
        item.employee.fullName ?? `${item.employee.firstName} ${item.employee.lastName}`,
        item.employee.employmentType,
        item.employee.currency,
        Number(item.basicPay),
        Number(item.otPay) + Number((item as any).ot20Pay ?? 0) + Number(item.phPay),
        Number(item.phPay),
        Number((item as any).bonus ?? 0),
        Number(item.grossPay),
        Number(item.nssfEmployee),
        Number(item.paye),
        Number(item.sdl),
        Number(item.netPay),
        Number(item.totalEmployerCost),
      ]);
      // Format number columns
      [5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach((col) => {
        r.getCell(col).numFmt = numFmt;
      });
    });

    // Totals row
    const totRow = ws.addRow([
      "", "TOTAL", "", "", "",
      ...["E", "F", "G", "H", "I", "J", "K", "L", "M", "N"].map(
        (col) => ({ formula: `SUM(${col}4:${col}${3 + run.items.length})` }),
      ),
    ]);
    totRow.font = { bold: true };
    totRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E0EA" } };
    });

    ws.addRow([]);
    ws.addRow([`Currency: ${currency}`, "", `Exchange Rate: ${run.exchangeRate ?? "N/A"}`, "", `Deductions Active: ${((run as any).deductionsActive) ? "Yes" : "NO — Suspended"}`]);
    ws.addRow([`Generated: ${new Date().toLocaleString()}`]);

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async nssfScheduleExcel(companyId: string, payrollRunId: string): Promise<Buffer> {
    const run = await this.getRun(companyId, payrollRunId);
    const company = run.company;
    const country = (company.country ?? "TZ") as any;
    const config = COUNTRY_CONFIGS[country as "TZ"] ?? COUNTRY_CONFIGS["TZ"];
    const monthName = new Date(run.periodYear, run.periodMonth - 1, 1)
      .toLocaleString("en-US", { month: "long", year: "numeric" });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${config.pensionLabel} Schedule`);

    ws.mergeCells("A1:G1");
    ws.getCell("A1").value = `${config.pensionLabel} Schedule — ${company.name} — ${monthName}`;
    ws.getCell("A1").font = { bold: true, size: 13 };
    ws.addRow([`Reg No: ${company.nssfReg ?? "—"}`]);
    ws.addRow([]);

    const hrow = ws.addRow(["No", "Employee Code", "Employee Name", "Gross Pay", `${config.pensionLabel} EE`, `${config.pensionLabel} ER`, "Total"]);
    hrow.font = { bold: true };
    ws.columns = [{ width: 5 }, { width: 14 }, { width: 28 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }];

    run.items.forEach((item, i) => {
      const ee = Number(item.nssfEmployee);
      const er = Number(item.nssfEmployer);
      ws.addRow([
        i + 1,
        item.employee.employeeNumber,
        item.employee.fullName ?? `${item.employee.firstName} ${item.employee.lastName}`,
        Number(item.grossPay),
        ee,
        er,
        ee + er,
      ]);
    });

    const startRow = 5;
    const endRow = 4 + run.items.length;
    ws.addRow(["", "", "TOTAL",
      { formula: `SUM(D${startRow}:D${endRow})` },
      { formula: `SUM(E${startRow}:E${endRow})` },
      { formula: `SUM(F${startRow}:F${endRow})` },
      { formula: `SUM(G${startRow}:G${endRow})` },
    ]).font = { bold: true };

    ws.addRow([]);
    ws.addRow([`Filing deadline: ${(config.filingDeadlines as any).nssf ?? (config.filingDeadlines as any).paye ?? "—"}`]);

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async p9AnnualExcel(companyId: string, year: number): Promise<Buffer> {
    const company = await this.prisma.company.findFirstOrThrow({ where: { id: companyId } });
    const country = (company.country ?? "TZ") as any;
    const config = COUNTRY_CONFIGS[country as "TZ"] ?? COUNTRY_CONFIGS["TZ"];

    const lockedRuns = await this.prisma.payrollRun.findMany({
      where: { companyId, periodYear: year, status: "LOCKED" },
      include: { items: { include: { employee: true } } },
      orderBy: { periodMonth: "asc" },
    });

    // Aggregate per employee
    const empMap: Record<string, any> = {};
    for (const run of lockedRuns) {
      for (const item of run.items) {
        const key = item.employeeId;
        if (!empMap[key]) {
          empMap[key] = {
            employee: item.employee,
            monthsWorked: 0,
            ytdGross: 0, ytdPaye: 0, ytdNssf: 0, ytdNet: 0,
          };
        }
        empMap[key].monthsWorked++;
        empMap[key].ytdGross += Number(item.grossPay);
        empMap[key].ytdPaye  += Number(item.paye);
        empMap[key].ytdNssf  += Number(item.nssfEmployee);
        empMap[key].ytdNet   += Number(item.netPay);
      }
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(country === "BW" ? "ITW Annual" : "P9A");

    ws.mergeCells("A1:J1");
    ws.getCell("A1").value = `${country === "BW" ? "ITW Annual Return" : "P9A — Annual PAYE Return"} ${year} — ${company.name}`;
    ws.getCell("A1").font = { bold: true, size: 13 };
    ws.addRow([`${config.taxIdLabel}: ${company.taxNumber ?? "—"}`]);
    ws.addRow([`Filing deadline: ${(config.filingDeadlines as any).p9a ?? (config.filingDeadlines as any).annual ?? "—"}`]);
    ws.addRow([]);

    const hrow = ws.addRow([
      "No", "Employee Code", "Employee Name", `${config.taxIdLabel}`,
      "Months", "YTD Gross", `${config.pensionLabel} Deducted`, "Taxable Income", "YTD PAYE", "Effective Rate",
    ]);
    hrow.font = { bold: true };
    ws.columns = [
      { width: 5 }, { width: 14 }, { width: 28 }, { width: 16 },
      { width: 8 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 14 }, { width: 14 },
    ];

    Object.values(empMap).forEach((data: any, i) => {
      const taxable = data.ytdGross - data.ytdNssf;
      const rate = data.ytdGross > 0 ? ((data.ytdPaye / data.ytdGross) * 100).toFixed(1) + "%" : "0%";
      ws.addRow([
        i + 1,
        data.employee.employeeNumber,
        data.employee.fullName ?? `${data.employee.firstName} ${data.employee.lastName}`,
        data.employee.taxIdentificationNumber ?? "—",
        data.monthsWorked,
        data.ytdGross,
        data.ytdNssf,
        taxable,
        data.ytdPaye,
        rate,
      ]);
    });

    const startRow = 6;
    const endRow = 5 + Object.keys(empMap).length;
    ws.addRow(["", "", "TOTAL", "", "",
      { formula: `SUM(F${startRow}:F${endRow})` },
      { formula: `SUM(G${startRow}:G${endRow})` },
      { formula: `SUM(H${startRow}:H${endRow})` },
      { formula: `SUM(I${startRow}:I${endRow})` },
      "",
    ]).font = { bold: true };

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ── Sage Guide Ch. 12: Bank payment file (CSV for bank upload) ──────────
  async bankPaymentCsv(companyId: string, runId: string): Promise<string> {
    const run = await (this.prisma.payrollRun as any).findFirstOrThrow({
      where: { companyId, id: runId },
      include: {
        items: { include: { employee: true }, orderBy: { employee: { employeeNumber: "asc" } } },
        company: true,
      },
    });

    const month = new Date(run.periodYear, run.periodMonth - 1)
      .toLocaleString("en-US", { month: "long", year: "numeric" });

    const csvLines: string[] = [
      `# Bank Payment File — ${run.company?.name ?? "Company"} — ${month}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Run Status: ${run.status}`,
      `# Total Net Pay: ${Math.round(Number(run.totals?.netPay ?? 0)).toLocaleString()} ${run.company?.baseCurrency ?? "TZS"}`,
      "",
      "SEQ,EMPLOYEE_NUMBER,FULL_NAME,BANK_NAME,ACCOUNT_NUMBER,CURRENCY,NET_PAY,REFERENCE",
    ];

    run.items.forEach((item: any, idx: number) => {
      const emp = item.employee;
      const ref = `PAYROLL-${run.periodYear}${String(run.periodMonth).padStart(2, "0")}-${emp.employeeNumber}`;
      csvLines.push([
        idx + 1,
        emp.employeeNumber,
        `"${emp.fullName ?? `${emp.firstName} ${emp.lastName}`}"`,
        `"${emp.bankName ?? ""}"`,
        emp.bankAccountNumber ?? "",
        emp.currency ?? "TZS",
        Math.round(Number(item.netPay)),
        ref,
      ].join(","));
    });

    csvLines.push("");
    csvLines.push(`TOTAL,,,,,,${Math.round(Number(run.totals?.netPay ?? 0))},`);
    return csvLines.join("\n");
  }
}
