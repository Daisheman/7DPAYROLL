"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export default function PayslipsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any[]>("/payroll/runs")
      .then((data) => {
        const eligible = data.filter((r) => ["APPROVED", "LOCKED"].includes(r.status));
        setRuns(eligible);
        if (eligible.length > 0) setSelectedRun(eligible[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const monthName = (r: any) =>
    new Date(r.periodYear, r.periodMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Payslips</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Download employee payslip PDFs from approved or locked payroll runs.</p>
      </div>

      {loading ? (
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-[var(--muted-foreground)]">
            No approved or locked payroll runs yet. Approve a payroll run first.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Run selector */}
          <Card>
            <CardHeader><h2 className="font-semibold">Select Payroll Run</h2></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedRun?.id === run.id
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
              </div>
            </CardContent>
          </Card>

          {/* Employee list */}
          {selectedRun && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="font-semibold">
                  {monthName(selectedRun)} — {selectedRun.items?.length ?? 0} employees
                </h2>
                <a href={`/api/reports/payroll-runs/${selectedRun.id}/summary.xlsx`} download>
                  <Button variant="secondary" size="sm">↓ Excel Summary</Button>
                </a>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-[var(--muted)]">
                      <th className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)]">Code</th>
                      <th className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)]">Employee</th>
                      <th className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)]">Type</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--muted-foreground)]">Gross Pay</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--muted-foreground)]">Net Pay</th>
                      <th className="text-center px-3 py-2 font-medium text-[var(--muted-foreground)]">Payslip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRun.items?.map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                        <td className="px-3 py-2 font-mono text-xs">{item.employee.employeeNumber}</td>
                        <td className="px-3 py-2 font-medium">
                          {item.employee.fullName ?? `${item.employee.firstName} ${item.employee.lastName}`}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${item.employee.employmentType === "HOURLY" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                            {item.employee.employmentType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">TZS {fmt(Number(item.grossPay))}</td>
                        <td className="px-3 py-2 text-right font-bold text-green-700">TZS {fmt(Number(item.netPay))}</td>
                        <td className="px-3 py-2 text-center">
                          <a
                            href={`/api/reports/payroll-runs/${selectedRun.id}/employees/${item.employeeId}/payslip.pdf`}
                            download={`payslip-${item.employee.employeeNumber}-${selectedRun.periodMonth}-${selectedRun.periodYear}.pdf`}
                          >
                            <Button size="sm" variant="secondary">↓ PDF</Button>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
