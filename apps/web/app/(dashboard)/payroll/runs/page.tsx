"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any[]>("/payroll/runs")
      .then(setRuns)
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-blue-100 text-blue-800",
    LOCKED: "bg-green-100 text-green-800",
  };

  const monthName = (r: any) =>
    new Date(r.periodYear, r.periodMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll Runs</h1>
          <p className="text-sm text-[var(--muted-foreground)]">All payroll periods for 7D Minerals (SA).</p>
        </div>
        <Link href="/payroll/runs/new">
          <Button>+ New Payroll Run</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-[var(--muted-foreground)] mb-4">No payroll runs yet.</p>
            <Link href="/payroll/runs/new"><Button>Create First Payroll Run</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[var(--muted)]">
                  {["Period","Employees","Exchange Rate","Gross Pay","PAYE","NSSF","Net Pay","Status","Deductions",""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b last:border-0 hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 font-semibold">{monthName(run)}</td>
                    <td className="px-4 py-3">{run.items?.length ?? 0}</td>
                    <td className="px-4 py-3">{run.exchangeRate ? Number(run.exchangeRate).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">TZS {fmt(run.totals?.grossPay ?? 0)}</td>
                    <td className="px-4 py-3 text-red-600">TZS {fmt(run.totals?.paye ?? 0)}</td>
                    <td className="px-4 py-3 text-red-600">TZS {fmt(run.totals?.nssfEmployee ?? 0)}</td>
                    <td className="px-4 py-3 font-bold text-green-700">TZS {fmt(run.totals?.netPay ?? 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[run.status] ?? "bg-gray-100"}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {run.deductionsActive === false ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Suspended</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/payroll/runs/${run.id}`}>
                        <Button size="sm" variant="secondary">Open</Button>
                      </Link>
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
