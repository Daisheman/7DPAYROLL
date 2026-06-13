"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// Statutory deadlines per country
const DEADLINES: Record<string, Array<{ name: string; deadline: string; authority: string }>> = {
  TZ: [
    { name: "PAYE Return", deadline: "15th of following month", authority: "TRA" },
    { name: "NSSF Schedule", deadline: "Month end", authority: "NSSF" },
    { name: "SDL Return", deadline: "15th of following month", authority: "TRA" },
    { name: "WCF Return", deadline: "31 March annually", authority: "WCF" },
  ],
  ZA: [
    { name: "PAYE / UIF Return", deadline: "7th of following month", authority: "SARS" },
    { name: "UIF Declaration", deadline: "7th of following month", authority: "Dept of Labour" },
    { name: "SDL Return", deadline: "7th of following month", authority: "SARS" },
    { name: "EMP501 Reconciliation", deadline: "31 May annually", authority: "SARS" },
  ],
  BW: [
    { name: "PAYE Return", deadline: "15th of following month", authority: "BURS" },
    { name: "BPOPF Contribution", deadline: "Last day of month", authority: "BPOPF" },
    { name: "Levy Return", deadline: "15th of following month", authority: "BURS" },
    { name: "Annual Return", deadline: "30 June annually", authority: "BURS" },
  ],
  KE: [
    { name: "PAYE Return", deadline: "9th of following month", authority: "KRA" },
    { name: "NHIF Contribution", deadline: "9th of following month", authority: "NHIF" },
    { name: "NSSF Contribution", deadline: "9th of following month", authority: "NSSF" },
    { name: "Annual P9 Return", deadline: "28 February", authority: "KRA" },
  ],
};

const PENSION_LABELS: Record<string, string> = {
  ZA: "UIF", BW: "BPOPF", TZ: "NSSF", KE: "NSSF",
  ZW: "NSSA", ZM: "NAPSA", NA: "Social Security", NG: "NSITF", GH: "SSNIT", UG: "NSSF",
};

export default function DashboardPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<any[]>("/payroll/runs").catch(() => []),
      api<any[]>("/employees").catch(() => []),
      api<any>("/company").catch(() => null),
    ]).then(([r, e, c]) => {
      setRuns(r);
      setEmployees(e);
      setCompany(c);
      setLoading(false);
    });
  }, []);

  const currency = company?.baseCurrency ?? "TZS";
  const country = (company?.country ?? "TZ").toUpperCase();
  const pensionLabel = PENSION_LABELS[country] ?? "NSSF";
  const deadlines = DEADLINES[country] ?? DEADLINES["TZ"];

  const latestRun = runs[0];
  const totals = latestRun?.totals ?? {};
  const activeCount = employees.filter((e) => e.isActive !== false).length;
  const monthName = latestRun
    ? new Date(latestRun.periodYear, latestRun.periodMonth - 1)
        .toLocaleString("en-US", { month: "long", year: "numeric" })
    : "No runs yet";

  const statusColor: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-blue-100 text-blue-800",
    LOCKED: "bg-green-100 text-green-800",
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {company?.name ?? "Loading..."} — {country} Payroll Workspace
          </p>
        </div>
        <Link href="/payroll/runs/new">
          <Button>+ New Payroll Run</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active Employees", value: loading ? "—" : String(activeCount), sub: "on payroll" },
          { label: "Gross Payroll", value: loading ? "—" : `${currency} ${fmt(totals.grossPay ?? 0)}`, sub: latestRun ? monthName : "No runs yet" },
          { label: "Net Payroll", value: loading ? "—" : `${currency} ${fmt(totals.netPay ?? 0)}`, sub: latestRun ? monthName : "No runs yet" },
          { label: "PAYE Due", value: loading ? "—" : `${currency} ${fmt(totals.paye ?? 0)}`, sub: "By 15th next month" },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-[var(--primary)] mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employer cost cards */}
      {latestRun && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: `${pensionLabel} (Employee)`, value: totals.nssfEmployee ?? 0 },
            { label: `${pensionLabel} (Employer)`, value: totals.nssfEmployer ?? 0 },
            { label: "SDL / Levy", value: totals.sdl ?? 0 },
            { label: "Total Employer Cost", value: totals.totalEmployerCost ?? 0 },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
                <p className="text-lg font-semibold">{currency} {fmt(value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent payroll runs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold">Recent Payroll Runs</h2>
          <Link href="/payroll/runs" className="text-sm text-[var(--primary)] hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
          ) : runs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--muted-foreground)] mb-4">No payroll runs yet.</p>
              <Link href="/payroll/runs/new"><Button>Create First Payroll Run</Button></Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {["Period","Employees","Gross Pay","Net Pay","Status",""].map((h) => (
                    <th key={h} className="text-left py-2 font-medium text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 5).map((run) => (
                  <tr key={run.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                    <td className="py-2 font-medium">
                      {new Date(run.periodYear, run.periodMonth - 1)
                        .toLocaleString("en-US", { month: "long", year: "numeric" })}
                    </td>
                    <td className="py-2">{run.items?.length ?? 0}</td>
                    <td className="py-2">{currency} {fmt(run.totals?.grossPay ?? 0)}</td>
                    <td className="py-2 font-semibold text-green-700">{currency} {fmt(run.totals?.netPay ?? 0)}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[run.status] ?? "bg-gray-100"}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <Link href={`/payroll/runs/${run.id}`} className="text-[var(--primary)] hover:underline text-xs">Open →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Statutory filing deadlines — dynamic per country */}
      <Card>
        <CardHeader><h2 className="font-semibold">Statutory Filing Deadlines — {country}</h2></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {deadlines.map(({ name, deadline, authority }) => (
              <div key={name} className="rounded-lg border p-3">
                <p className="font-medium text-sm">{name}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">{deadline}</p>
                <p className="text-xs text-[var(--primary)] mt-1">{authority}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
