"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export default function StatutoryReturnsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
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

  const selectedRun = runs.find((r) => r.id === selectedRunId);
  const totals = selectedRun?.totals ?? {};

  const monthName = (r: any) =>
    new Date(r.periodYear, r.periodMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Statutory Returns</h1>
        <p className="text-sm text-[var(--muted-foreground)]">PAYE, NSSF, SDL and WCF returns for Tanzania Revenue Authority and other bodies.</p>
      </div>

      {/* Run selector */}
      {runs.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold">Select Payroll Run</h2></CardHeader>
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
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary totals */}
      {selectedRun && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "PAYE Due", value: totals.paye ?? 0, deadline: "By 15th next month", authority: "TRA" },
            { label: "NSSF (EE + ER)", value: (totals.nssfEmployee ?? 0) + (totals.nssfEmployer ?? 0), deadline: "By month end", authority: "NSSF" },
            { label: "SDL Due", value: totals.sdl ?? 0, deadline: "By 15th next month", authority: "TRA" },
            { label: "WCF Due", value: totals.wcf ?? 0, deadline: "Annual - 31 March", authority: "WCF" },
          ].map(({ label, value, deadline, authority }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
                <p className="text-xl font-bold mt-1">TZS {fmt(value)}</p>
                <p className="text-xs text-amber-600 mt-1">{deadline}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{authority}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Return cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "PAYE Return",
            description: "Monthly PAYE deduction schedule for TRA. Shows taxable pay and PAYE per employee.",
            icon: "🏛️",
            deadline: "15th of following month",
            href: selectedRunId ? `/api/reports/payroll-runs/${selectedRunId}/summary.xlsx` : null,
            filename: "paye-return.xlsx",
          },
          {
            title: "NSSF Schedule",
            description: "NSSF contribution schedule showing employee and employer contributions per worker.",
            icon: "🏥",
            deadline: "End of month",
            href: selectedRunId ? `/api/reports/payroll-runs/${selectedRunId}/nssf.xlsx` : null,
            filename: "nssf-schedule.xlsx",
          },
          {
            title: "SDL Return",
            description: "Skills Development Levy return at 4.5% of gross payroll.",
            icon: "📚",
            deadline: "15th of following month",
            href: selectedRunId ? `/api/reports/payroll-runs/${selectedRunId}/summary.xlsx` : null,
            filename: "sdl-return.xlsx",
          },
          {
            title: "WCF Return",
            description: "Workers Compensation Fund contribution at 1% of gross payroll.",
            icon: "🦺",
            deadline: "31 March annually",
            href: selectedRunId ? `/api/reports/payroll-runs/${selectedRunId}/summary.xlsx` : null,
            filename: "wcf-return.xlsx",
          },
        ].map(({ title, description, icon, deadline, href, filename }) => (
          <Card key={title}>
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
                  <p className="text-xs text-amber-600 mt-2 mb-3">Filing deadline: {deadline}</p>
                  {!selectedRunId ? (
                    <p className="text-xs text-amber-600">Select a payroll run above to enable export.</p>
                  ) : (
                    <a href={href!} download={filename}>
                      <Button variant="secondary" size="sm">↓ Export</Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
