"use client";

// ── Sage Guide Ch. 15: Period End Processing ─────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export default function PeriodEndPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [checklist, setChecklist] = useState<any>(null);
  const [leaveAccrual, setLeaveAccrual] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"checklist" | "leave">("checklist");

  useEffect(() => {
    api<any[]>("/payroll/runs")
      .then((data) => {
        setRuns(data);
        if (data.length > 0) setSelectedRunId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRunId) return;
    setChecklist(null);
    setLeaveAccrual([]);
    api<any>(`/payroll/runs/${selectedRunId}/period-end-checklist`).then(setChecklist).catch(() => {});
    api<any[]>(`/payroll/runs/${selectedRunId}/leave-accrual`).then(setLeaveAccrual).catch(() => {});
  }, [selectedRunId]);

  const monthName = (r: any) =>
    new Date(r.periodYear, r.periodMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  const completedCount = checklist?.checklist?.filter((s: any) => s.complete).length ?? 0;
  const totalSteps = checklist?.checklist?.length ?? 0;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Period End Processing</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Month-end checklist, leave accrual, and payroll sign-off workflow.
          </p>
        </div>
      </div>

      {/* Run selector */}
      {runs.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold">Select Payroll Period</h2></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {runs.slice(0, 12).map((run) => (
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
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  run.status === "LOCKED" ? "bg-green-100 text-green-700" :
                  run.status === "APPROVED" ? "bg-blue-100 text-blue-700" :
                  "bg-yellow-100 text-yellow-700"}`}>
                  {run.status}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tab selector */}
      <div className="border-b flex gap-0">
        {(["checklist", "leave"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {t === "checklist" ? "✅ Period-End Checklist" : "📅 Leave Accrual"}
          </button>
        ))}
      </div>

      {/* Checklist tab */}
      {tab === "checklist" && (
        <>
          {checklist && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-semibold">
                    {monthName(runs.find((r) => r.id === selectedRunId) ?? runs[0])} — Month-End Checklist
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {completedCount}/{totalSteps} steps complete
                    </div>
                    <div className="w-32 h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${(completedCount / totalSteps) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {checklist.checklist.map((step: any) => (
                  <div key={step.step}
                    className={`flex items-start gap-4 rounded-lg border p-4 ${
                      step.complete ? "bg-green-50 border-green-200" : "border-[var(--border)]"}`}>
                    <div className={`text-xl ${step.complete ? "text-green-500" : "text-[var(--muted-foreground)]"}`}>
                      {step.complete ? "✓" : `${step.step}`}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${step.complete ? "text-green-800" : ""}`}>{step.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{step.note}</p>
                    </div>
                    {!step.complete && step.step <= 5 && (
                      <Link href={`/payroll/runs/${selectedRunId}`}>
                        <Button size="sm" variant="secondary" className="text-xs">Action →</Button>
                      </Link>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Download buttons */}
          {selectedRunId && (
            <Card>
              <CardHeader><h2 className="font-semibold">Period-End Downloads</h2></CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <a href={`/api/reports/payroll-runs/${selectedRunId}/summary.xlsx`} download>
                  <Button variant="secondary">↓ Payroll Summary Excel</Button>
                </a>
                <a href={`/api/reports/payroll-runs/${selectedRunId}/nssf.xlsx`} download>
                  <Button variant="secondary">↓ NSSF Schedule</Button>
                </a>
                <a href={`/api/reports/payroll-runs/${selectedRunId}/bank-payment.csv`} download>
                  <Button variant="secondary">↓ Bank Payment File (CSV)</Button>
                </a>
                <a href={`/api/reports/p9a?year=${new Date().getFullYear()}`} download>
                  <Button variant="secondary">↓ P9A Annual Return</Button>
                </a>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Leave Accrual tab */}
      {tab === "leave" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Leave Accrual Summary</h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Accrued leave entitlement by tenure — TZ: 28 days/year annual, 126 days/year sick · BW: 15 days/year annual, 24 days/year sick
                </p>
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">{leaveAccrual.length} employees</div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-[var(--muted)]">
                  {["Code", "Employee", "Start Date", "Tenure (Yrs)", "Annual Accrued", "Sick Accrued", "Annual Balance", "Sick Balance"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)] text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveAccrual.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-[var(--muted-foreground)]">
                    {selectedRunId ? "Loading..." : "Select a payroll run above."}
                  </td></tr>
                ) : leaveAccrual.map((e) => (
                  <tr key={e.employeeId} className="border-b last:border-0 hover:bg-[var(--muted)]">
                    <td className="px-3 py-2 font-mono text-xs">{e.employeeNumber}</td>
                    <td className="px-3 py-2 font-medium">{e.fullName}</td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">
                      {new Date(e.startDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-3 py-2">{Number(e.tenureYears).toFixed(1)} yrs</td>
                    <td className="px-3 py-2 text-blue-700 font-medium">
                      {Number(e.annualLeaveDaysEarned).toFixed(1)} days
                    </td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">
                      {Number(e.sickLeaveDaysEarned).toFixed(1)} days
                    </td>
                    <td className="px-3 py-2">
                      {e.currentAnnualBalance > 0 ? (
                        <span className="text-green-700 font-medium">{e.currentAnnualBalance} days</span>
                      ) : <span className="text-[var(--muted-foreground)]">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.currentSickBalance > 0 ? (
                        <span className="text-blue-700">{e.currentSickBalance} days</span>
                      ) : <span className="text-[var(--muted-foreground)]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
