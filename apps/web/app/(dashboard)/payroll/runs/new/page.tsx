"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function NewPayrollRunPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [form, setForm] = useState({
    periodMonth: String(now.getMonth() + 1),
    periodYear: String(now.getFullYear()),
    workingDays: "26",
    standardHoursPerDay: "9",
    exchangeRate: "2600",
    deductionsActive: true,
    payCycle: "MONTHLY",
  });

  useEffect(() => {
    api<any[]>("/employees").then((emps) => setEmployeeCount(emps.filter((e) => e.isActive !== false).length)).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const month = Number(form.periodMonth);
      const year = Number(form.periodYear);
      const run = await api<any>("/payroll/runs", {
        method: "POST",
        body: JSON.stringify({
          periodMonth: month,
          periodYear: year,
          workingDays: Number(form.workingDays),
          standardHoursPerDay: Number(form.standardHoursPerDay),
          exchangeRate: Number(form.exchangeRate) || undefined,
          deductionsActive: form.deductionsActive,
          payCycle: form.payCycle,
          paymentDate: new Date(year, month - 1, 25).toISOString(),
        }),
      });
      router.push(`/payroll/runs/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create payroll run");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="grid gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Create Payroll Run</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          This will calculate payroll for all active employees for the selected period.
        </p>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold">Payroll Period</h2></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Month *</label>
                <select
                  className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm"
                  {...field("periodMonth")}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Year *</label>
                <Input type="number" min="2020" max="2100" {...field("periodYear")} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Working Days</label>
                <Input type="number" min="1" max="31" {...field("workingDays")} />
                <p className="text-xs text-[var(--muted-foreground)]">Standard working days in the month</p>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Standard Hours / Day</label>
                <Input type="number" min="1" max="24" step="0.5" {...field("standardHoursPerDay")} />
                <p className="text-xs text-[var(--muted-foreground)]">Used for OT rate calculation on fixed salary employees</p>
              </div>
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">USD → TZS Exchange Rate</label>
              <Input type="number" min="1" step="1" {...field("exchangeRate")} />
              <p className="text-xs text-[var(--muted-foreground)]">
                Required — this company has USD employees. Enter the rate for this month (e.g. 2600).
              </p>
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Pay Cycle</label>
              <select
                className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm"
                value={form.payCycle ?? "MONTHLY"}
                onChange={(e) => setForm((f: any) => ({ ...f, payCycle: e.target.value }))}
              >
                <option value="MONTHLY">Monthly (12× per year)</option>
                <option value="SEMIMONTHLY">Semi-Monthly (24× per year)</option>
                <option value="BIWEEKLY">Bi-Weekly (26× per year)</option>
                <option value="WEEKLY">Weekly (52× per year)</option>
              </select>
              <p className="text-xs text-[var(--muted-foreground)]">Select the pay frequency for this period.</p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4 bg-[var(--muted)]">
              <input
                type="checkbox"
                id="deductions"
                checked={form.deductionsActive}
                onChange={(e) => setForm((f) => ({ ...f, deductionsActive: e.target.checked }))}
                className="h-4 w-4"
              />
              <div>
                <label htmlFor="deductions" className="text-sm font-medium cursor-pointer">
                  Apply Statutory Deductions
                </label>
                <p className="text-xs text-[var(--muted-foreground)]">
                  When checked: PAYE, NSSF, SDL and WCF are calculated. Uncheck to set Net Pay = Gross Pay (e.g. first month on site).
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error.includes("already exists") ? "A payroll run for this period already exists. Please select a different month." : error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Calculating..." : "Create & Calculate Payroll"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-sm">What happens next?</h2></CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)] grid gap-2">
          <p>1. Payroll lines are created for all {employeeCount !== null ? employeeCount : "active"} active employees.</p>
          <p>2. Basic pay, allowances, PAYE, NSSF, SDL and WCF are calculated automatically.</p>
          <p>3. You can then edit individual lines — OT hours, standby days, bonuses, adjustments.</p>
          <p>4. Once reviewed, Approve the run. Then Lock it to freeze YTD figures and enable payslip downloads.</p>
        </CardContent>
      </Card>
    </div>
  );
}
