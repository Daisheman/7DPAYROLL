"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReportsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any[]>("/payroll/runs")
      .then((data) => {
        const eligible = data.filter((r) => ["APPROVED", "LOCKED"].includes(r.status));
        setRuns(eligible);
        if (eligible.length > 0) setSelectedRunId(eligible[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const monthName = (r: any) =>
    new Date(r.periodYear, r.periodMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  const reports = [
    {
      title: "Payroll Summary",
      description: "Full payroll register with gross pay, deductions and net pay per employee.",
      icon: "📊",
      href: selectedRunId ? `/api/reports/payroll-runs/${selectedRunId}/summary.xlsx` : null,
      filename: "payroll-summary.xlsx",
      needsRun: true,
    },
    {
      title: "NSSF Schedule",
      description: "Monthly NSSF contribution schedule for filing with NSSF.",
      icon: "📋",
      href: selectedRunId ? `/api/reports/payroll-runs/${selectedRunId}/nssf.xlsx` : null,
      filename: "nssf-schedule.xlsx",
      needsRun: true,
    },
    {
      title: "P9A Annual Return",
      description: "Annual PAYE return for filing with TRA. Covers all locked runs for the selected year.",
      icon: "📄",
      href: `/api/reports/p9a?year=${year}`,
      filename: `p9a-${year}.xlsx`,
      needsRun: false,
    },
    {
      title: "Payslips (All Employees)",
      description: "Download individual payslip PDFs from the Payslips page.",
      icon: "🧾",
      href: "/payslips",
      filename: null,
      needsRun: false,
      isLink: true,
    },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Exports</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Generate statutory returns, payroll summaries and employee tax certificates.</p>
      </div>

      {/* Payroll run selector */}
      {runs.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold">Select Payroll Run (for monthly reports)</h2></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  selectedRunId === run.id
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-[var(--card)] hover:bg-[var(--muted)] border-[var(--border)]"
                }`}
              >
                {monthName(run)}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${run.status === "LOCKED" ? "bg-green-200 text-green-800" : "bg-blue-200 text-blue-800"}`}>
                  {run.status}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Year selector for annual reports */}
      <Card>
        <CardHeader><h2 className="font-semibold">Tax Year (for annual reports)</h2></CardHeader>
        <CardContent>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm w-40"
          >
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </CardContent>
      </Card>

      {/* Report cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map(({ title, description, icon, href, filename, needsRun, isLink }) => (
          <Card key={title}>
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-4">{description}</p>
                  {needsRun && !selectedRunId ? (
                    <p className="text-xs text-amber-600">Select an approved payroll run above to enable this report.</p>
                  ) : isLink ? (
                    <a href={href!}>
                      <Button variant="secondary" size="sm">Open Payslips →</Button>
                    </a>
                  ) : (
                    <a href={href!} download={filename}>
                      <Button variant="secondary" size="sm">↓ Download Excel</Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filing deadlines reminder */}
      <Card>
        <CardHeader><h2 className="font-semibold">Tanzania Filing Deadlines</h2></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            {[
              ["PAYE Monthly Return", "15th of the following month", "TRA"],
              ["NSSF Contributions", "End of the month", "NSSF"],
              ["SDL Return", "15th of the following month", "TRA"],
              ["WCF Annual Return", "31 March each year", "WCF"],
              ["P9A Annual Return", "31 January following year", "TRA"],
            ].map(([name, deadline, authority]) => (
              <div key={name} className="flex justify-between items-center border rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{deadline}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{authority}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
