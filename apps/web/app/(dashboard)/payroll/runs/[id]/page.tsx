"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import Link from "next/link";

const fmt = (n: number) => Math.round(Number(n ?? 0)).toLocaleString("en-US");

type Run = {
  id: string; periodMonth: number; periodYear: number; status: string;
  exchangeRate?: number; deductionsActive: boolean; workingDays: number;
  standardHoursPerDay: number; items: any[]; totals: Record<string, number>;
  company?: { country?: string; baseCurrency?: string; name?: string };
  approvedBy?: string; lockedAt?: string;
};
type Tab = "lines" | "upload" | "summary";

// ── Stable input component — has its own state, not affected by parent re-renders ──
function LineInput({
  initialValue, field, lineId, runId, onSave, disabled, highlight = false, wide = false,
}: {
  initialValue: number; field: string; lineId: string; runId: string;
  onSave: (lineId: string, field: string, value: number) => void;
  disabled: boolean; highlight?: boolean; wide?: boolean;
}) {
  const [val, setVal] = useState(String(initialValue ?? 0));
  // Update local value if the server value changes (e.g. after another field save)
  useEffect(() => { setVal(String(initialValue ?? 0)); }, [initialValue]);

  return (
    <Input
      type="number" step="0.01" min={0}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        const num = Number(val);
        if (num !== Number(initialValue ?? 0)) onSave(lineId, field, num);
      }}
      disabled={disabled}
      className={
        highlight
          ? `${wide ? "w-28" : "w-20"} h-9 text-sm text-center font-bold text-white border-2 border-[var(--primary)] bg-[var(--primary)] focus:bg-[var(--primary)] placeholder:text-white/70`
          : `${wide ? "w-28" : "w-20"} h-9 text-sm text-center bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]`
      }
    />
  );
}

export default function PayrollRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [saving, setSaving] = useState("");
  const [togglingDeductions, setTogglingDeductions] = useState(false);
  const [approving, setApproving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("lines");
  const [showZeroHour, setShowZeroHour] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);
  useEffect(() => {
    if (id) api<Run>(`/payroll/runs/${id}`).then(setRun).catch(() => setError("Failed to load"));
  }, [id]);

  // ── Stable save handler — only updates the one changed line ──────────────
  const handleSave = useCallback(async (lineId: string, field: string, value: number) => {
    if (saving) return;
    setSaving(lineId);
    try {
      const updated = await api<any>(`/payroll/runs/${id}/lines/${lineId}`, {
        method: "PATCH", body: JSON.stringify({ [field]: value }),
      });
      // Only update the specific line — preserves all other input states
      setRun((r) => r ? {
        ...r,
        totals: updated.run?.totals ?? r.totals,
        items: r.items.map((i) => i.id === lineId ? { ...i, ...updated } : i),
      } : r);
    } catch { /* silent — value stays in input */ }
    finally { setSaving(""); }
  }, [id, saving]);

  async function toggleDeductions() {
    if (!run) return;
    if (!confirm(run.deductionsActive ? "Turn OFF statutory deductions?" : "Turn ON statutory deductions?")) return;
    setTogglingDeductions(true);
    try {
      const updated = await api<Run>(`/payroll/runs/${id}/toggle-deductions`, {
        method: "POST", body: JSON.stringify({ active: !run.deductionsActive }),
      });
      setRun(updated); setSuccess("Deductions updated.");
    } finally { setTogglingDeductions(false); }
  }

  async function approve() {
    if (!confirm("Approve this payroll run?")) return;
    setApproving(true);
    try { setRun(await api<Run>(`/payroll/runs/${id}/approve`, { method: "POST" })); setSuccess("Approved."); }
    catch (e: any) { setError(e.message); } finally { setApproving(false); }
  }

  async function lock() {
    if (!confirm("Lock this payroll run? YTD figures will be frozen. This cannot be undone.")) return;
    setLocking(true);
    try { setRun(await api<Run>(`/payroll/runs/${id}/lock`, { method: "POST" })); setSuccess("Locked. YTD updated."); }
    catch (e: any) { setError(e.message); } finally { setLocking(false); }
  }

  async function reverse() {
    if (!confirm("Reverse this run? It will reset to DRAFT with zero totals.")) return;
    setReversing(true);
    try { setRun(await api<Run>(`/payroll/runs/${id}/reverse`, { method: "POST", body: JSON.stringify({}) })); setSuccess("Run reversed."); }
    catch (e: any) { setError(e.message); } finally { setReversing(false); }
  }

  async function previewUpload() {
    if (!uploadFile) return;
    setUploading(true); setError(""); setUploadPreview(null);
    try {
      const csrf = await api<any>("/auth/csrf");
      const fd = new FormData(); fd.append("file", uploadFile);
      const res = await fetch("/api/import/timesheet/preview", {
        method: "POST", credentials: "include",
        headers: { "x-csrf-token": csrf.csrfToken }, body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setUploadPreview(await res.json());
    } catch (e: any) { setError(e.message); } finally { setUploading(false); }
  }

  async function applyUpload() {
    if (!uploadPreview) return;
    setApplying(true); setError("");
    try {
      const csrf = await api<any>("/auth/csrf");
      const res = await fetch(`/api/import/timesheet/apply/${id}`, {
        method: "POST", credentials: "include",
        headers: { "x-csrf-token": csrf.csrfToken, "content-type": "application/json" },
        body: JSON.stringify({ runId: id, rows: JSON.stringify(uploadPreview.rows) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setSuccess(`Applied ${result.applied} of ${result.total} rows.`);
      setUploadPreview(null); setUploadFile(null);
      setRun(await api<Run>(`/payroll/runs/${id}`));
      setActiveTab("lines");
    } catch (e: any) { setError(e.message); } finally { setApplying(false); }
  }

  if (!run) return <div className="p-8 text-[var(--muted-foreground)]">Loading payroll run...</div>;

  const monthName = new Date(run.periodYear, run.periodMonth - 1)
    .toLocaleString("en-US", { month: "long", year: "numeric" });
  const currency = run.company?.baseCurrency ?? "TZS";
  const country = run.company?.country ?? "TZ";
  const pensionLabel = country === "BW" ? "BPOPF" : country === "ZA" ? "UIF" : "NSSF";
  const locked = run.status === "LOCKED";

  const hourlyLines = run.items.filter((l) => l.employee?.employmentType === "HOURLY");
  const fixedLines = run.items.filter((l) => l.employee?.employmentType !== "HOURLY");
  const visibleHourly = showZeroHour ? hourlyLines : hourlyLines.filter((l) => Number(l.actualHours) > 0);
  const hiddenCount = hourlyLines.length - visibleHourly.length;

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted-foreground)] mb-1">Payroll Runs / {monthName}</p>
          <h1 className="text-2xl font-bold">Payroll — {monthName}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${run.status === "LOCKED" ? "bg-green-100 text-green-800" : run.status === "APPROVED" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
              {run.status}
            </span>
            {!run.deductionsActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">⚠ Deductions OFF</span>}
            <span className="text-xs text-[var(--muted-foreground)] py-0.5">{run.items.length} employees</span>
            {run.exchangeRate && <span className="text-xs text-[var(--muted-foreground)] py-0.5">Rate: {Number(run.exchangeRate).toLocaleString()} {currency}/USD</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!locked && (
            <Button size="sm" variant="secondary" onClick={toggleDeductions} disabled={togglingDeductions}
              className={run.deductionsActive ? "border-red-200 text-red-700" : "border-green-200 text-green-700"}>
              {togglingDeductions ? "..." : run.deductionsActive ? "Suspend Deductions" : "Enable Deductions"}
            </Button>
          )}
          {run.status === "DRAFT" && <Button size="sm" onClick={approve} disabled={approving}>{approving ? "Approving..." : "Approve Run"}</Button>}
          {run.status === "APPROVED" && <Button size="sm" variant="secondary" onClick={lock} disabled={locking}>{locking ? "Locking..." : "Lock & Finalise"}</Button>}
          {(run.status === "APPROVED" || run.status === "DRAFT") && (
            <Button size="sm" variant="secondary" onClick={reverse} disabled={reversing} className="border-red-200 text-red-700 hover:bg-red-50">
              {reversing ? "Reversing..." : "↺ Reverse Run"}
            </Button>
          )}
          <a href={`/api/reports/payroll-runs/${id}/summary.xlsx`} download><Button size="sm" variant="secondary">↓ Excel</Button></a>
          <a href={`/api/reports/payroll-runs/${id}/bank-payment.csv`} download><Button size="sm" variant="secondary">↓ Bank CSV</Button></a>
          <a href={`/api/reports/payroll-runs/${id}/nssf.xlsx`} download><Button size="sm" variant="secondary">↓ {pensionLabel}</Button></a>
          {!locked && <Link href={`/payroll/runs/${id}/upload`}><Button size="sm" variant="secondary">📤 Upload Timesheet</Button></Link>}
        </div>
      </div>

      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex justify-between"><span>{success}</span><button onClick={() => setSuccess("")} className="font-bold ml-2">×</button></div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 flex justify-between"><span>{error}</span><button onClick={() => setError("")} className="font-bold ml-2">×</button></div>}

      {/* Summary cards */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Gross Payroll", value: run.totals?.grossPay ?? 0, color: "" },
          { label: "Total PAYE", value: run.totals?.paye ?? 0, color: "text-red-600" },
          { label: `Total ${pensionLabel}`, value: run.totals?.nssfEmployee ?? 0, color: "text-red-600" },
          { label: "Net Payroll", value: run.totals?.netPay ?? 0, color: "text-green-700" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="pt-4">
            <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color}`}>{currency} {fmt(value)}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {([["lines","Payroll Lines"],["upload","📤 Upload Spreadsheet"],["summary","Summary"]] as [Tab, string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══ PAYROLL LINES ═══ */}
      {activeTab === "lines" && (
        <div className="grid gap-6">

          {/* HOURLY */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Hourly Employees ({hourlyLines.length})</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Enter actual hours. Fields auto-save when you move to the next one.</p>
                </div>
                {hiddenCount > 0 && (
                  <button onClick={() => setShowZeroHour(!showZeroHour)} className="text-xs text-[var(--primary)] hover:underline">
                    {showZeroHour ? `Hide ${hiddenCount} zero-hour employees` : `+ Show ${hiddenCount} employees with 0 hours`}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {visibleHourly.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">
                  No hourly employees with hours entered.{" "}
                  {hiddenCount > 0 && <button onClick={() => setShowZeroHour(true)} className="text-[var(--primary)] hover:underline">Show all {hourlyLines.length}</button>}
                </div>
              ) : visibleHourly.map((line) => {
                const emp = line.employee ?? {};
                const name = emp.fullName ?? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();
                const isSaving = saving === line.id;
                return (
                  <div key={line.id} className={`border-b last:border-0 p-4 transition-opacity ${isSaving ? "opacity-50" : ""}`}>
                    {/* Employee header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">{emp.employeeNumber}</span>
                        <span className="font-semibold">{name}</span>
                        {isSaving && <span className="text-xs text-[var(--muted-foreground)] animate-pulse">saving…</span>}
                      </div>
                      <div className="flex items-center gap-5 text-sm">
                        <span className="text-[var(--muted-foreground)]">Gross <strong className="text-[var(--foreground)]">{fmt(line.grossPay)}</strong></span>
                        <span className="text-[var(--muted-foreground)]">PAYE <strong className="text-red-600">{fmt(line.paye)}</strong></span>
                        <span className="text-[var(--muted-foreground)]">Net <strong className="text-green-700">{fmt(line.netPay)}</strong></span>
                        <a href={`/api/reports/payroll-runs/${id}/employees/${line.employeeId}/payslip.pdf`} download className="text-[var(--primary)] hover:underline text-xs">↓ Payslip</a>
                      </div>
                    </div>
                    {/* Inputs — each has its own state via LineInput */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-[var(--primary)]">Actual Hours ★</label>
                        <LineInput initialValue={Number(line.actualHours)} field="actualHours"
                          lineId={line.id} runId={id} onSave={handleSave} disabled={locked} highlight />
                      </div>
                      {[
                        { label: "OT 1.5×", field: "otHours", val: Number(line.otHours ?? 0) },
                        { label: "OT 2.0×", field: "ot20Hours", val: Number(line.ot20Hours ?? 0) },
                        { label: "PH 2.0×", field: "phHours", val: Number(line.phHours ?? 0) },
                        { label: "Standby Days", field: "standbyDays", val: Number(line.standbyDays ?? 0) },
                        { label: "Callout 1.5×", field: "callout15Hours", val: Number(line.callout15Hours ?? 0) },
                        { label: "Callout 2.0×", field: "callout20Hours", val: Number(line.callout20Hours ?? 0) },
                        { label: "Bonus", field: "bonus", val: Number(line.bonus ?? 0) },
                        { label: "Deductions", field: "otherDeductions", val: Number(line.otherDeductions ?? 0) },
                        { label: "Adjustments", field: "adjustments", val: Number(line.adjustments ?? 0) },
                      ].map(({ label, field, val }) => (
                        <div key={field} className="grid gap-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)]">{label}</label>
                          <LineInput initialValue={val} field={field} lineId={line.id} runId={id}
                            onSave={handleSave} disabled={locked} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* FIXED */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Fixed Salary Employees ({fixedLines.length})</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Salaries calculated automatically. Add bonus, deductions or adjustments as needed.</p>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[var(--muted)]">
                    {["Code","Employee","Gross","PAYE",pensionLabel,"Net Pay","Bonus","Deductions","Adj",""].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)] text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fixedLines.map((line) => {
                    const emp = line.employee ?? {};
                    const isSaving = saving === line.id;
                    return (
                      <tr key={line.id} className={`border-b last:border-0 hover:bg-[var(--muted)] transition-opacity ${isSaving ? "opacity-50" : ""}`}>
                        <td className="px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">{emp.employeeNumber}</td>
                        <td className="px-3 py-2 font-medium">{emp.fullName ?? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim()}</td>
                        <td className="px-3 py-2">{fmt(line.grossPay)}</td>
                        <td className="px-3 py-2 text-red-600">{fmt(line.paye)}</td>
                        <td className="px-3 py-2 text-red-600">{fmt(line.nssfEmployee)}</td>
                        <td className="px-3 py-2 font-bold text-green-700">{fmt(line.netPay)}</td>
                        <td className="px-2 py-1">
                          <LineInput initialValue={Number(line.bonus ?? 0)} field="bonus"
                            lineId={line.id} runId={id} onSave={handleSave} disabled={locked} wide />
                        </td>
                        <td className="px-2 py-1">
                          <LineInput initialValue={Number(line.otherDeductions ?? 0)} field="otherDeductions"
                            lineId={line.id} runId={id} onSave={handleSave} disabled={locked} wide />
                        </td>
                        <td className="px-2 py-1">
                          <LineInput initialValue={Number(line.adjustments ?? 0)} field="adjustments"
                            lineId={line.id} runId={id} onSave={handleSave} disabled={locked} />
                        </td>
                        <td className="px-2 py-1">
                          <a href={`/api/reports/payroll-runs/${id}/employees/${line.employeeId}/payslip.pdf`}
                            download className="text-[var(--primary)] hover:underline text-xs">↓ Slip</a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-[var(--muted)] font-bold">
                    <td colSpan={2} className="px-3 py-2 text-sm">TOTALS</td>
                    <td className="px-3 py-2">{fmt(run.totals?.grossPay ?? 0)}</td>
                    <td className="px-3 py-2 text-red-600">{fmt(run.totals?.paye ?? 0)}</td>
                    <td className="px-3 py-2 text-red-600">{fmt(run.totals?.nssfEmployee ?? 0)}</td>
                    <td className="px-3 py-2 text-green-700">{fmt(run.totals?.netPay ?? 0)}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ UPLOAD ═══ */}
      {activeTab === "upload" && (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-semibold">Upload Monthly Payroll Spreadsheet</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Sheet tab must be named after the month (e.g. July). Hours import and recalculate automatically.</p>
                </div>
                <a href={`/api/import/template?month=${run.periodMonth}&year=${run.periodYear}`} download>
                  <Button size="sm" variant="secondary">↓ Download Template</Button>
                </a>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[var(--primary)] transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
                onClick={() => fileRef.current?.click()}
              >
                <p className="text-3xl mb-2">📊</p>
                <p className="font-medium">{uploadFile ? uploadFile.name : "Click or drag Excel file here"}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Sheet tab must be named: <strong>{new Date(run.periodYear, run.periodMonth - 1).toLocaleString("en-US", { month: "long" })}</strong>
                </p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="flex gap-3">
                <Button onClick={previewUpload} disabled={!uploadFile || uploading} variant="secondary">
                  {uploading ? "Reading file..." : "Preview Data"}
                </Button>
                {uploadPreview && (
                  <Button onClick={applyUpload} disabled={applying}>
                    {applying ? "Applying..." : `✓ Apply ${uploadPreview.rows?.filter((r: any) => r.matched).length} rows to Payroll`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {uploadPreview && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-semibold">Preview — {uploadPreview.sheetName}</h2>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">{uploadPreview.rows?.filter((r: any) => r.matched).length} matched</span>
                    {uploadPreview.rows?.filter((r: any) => !r.matched).length > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">{uploadPreview.rows?.filter((r: any) => !r.matched).length} unmatched</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b bg-[var(--muted)]">
                      {["Code","Employee","Type","Act.Hrs","OT","Deductions","Status"].map((h) => (
                        <th key={h} className="text-left px-2 py-2 font-medium text-[var(--muted-foreground)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadPreview.rows?.map((row: any) => (
                      <tr key={row.seq} className={`border-b last:border-0 ${!row.matched ? "bg-amber-50" : "hover:bg-[var(--muted)]"}`}>
                        <td className="px-2 py-1.5 font-mono">{row.employeeCode}</td>
                        <td className="px-2 py-1.5 font-medium">{row.employeeName}</td>
                        <td className="px-2 py-1.5">{row.payType}</td>
                        <td className="px-2 py-1.5 text-right">{row.actualHours || "—"}</td>
                        <td className="px-2 py-1.5 text-right">{row.otHours || "—"}</td>
                        <td className="px-2 py-1.5 text-right">{row.otherDeductions ? Number(row.otherDeductions).toLocaleString() : "—"}</td>
                        <td className="px-2 py-1.5">{row.matched ? <span className="text-green-600 font-medium">✓</span> : <span className="text-amber-600">{row.errors?.[0]}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══ SUMMARY ═══ */}
      {activeTab === "summary" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><h2 className="font-semibold">Payroll Summary</h2></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {[["Period", monthName],["Status", run.status],["Employees", String(run.items.length)],
                ["Working Days", String(run.workingDays)],
                ["Exchange Rate", run.exchangeRate ? `${Number(run.exchangeRate).toLocaleString()} ${currency}/USD` : "N/A"],
                ["Deductions", run.deductionsActive ? "Active" : "Suspended"]
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-[var(--muted-foreground)]">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Statutory Summary</h2></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {[["Gross Payroll", run.totals?.grossPay ?? 0],["PAYE", run.totals?.paye ?? 0],
                [`${pensionLabel} Employee`, run.totals?.nssfEmployee ?? 0],
                [`${pensionLabel} Employer`, run.totals?.nssfEmployer ?? 0],
                ["SDL", run.totals?.sdl ?? 0],["WCF", run.totals?.wcf ?? 0],
                ["Net Payroll", run.totals?.netPay ?? 0],
                ["Total Employer Cost", run.totals?.totalEmployerCost ?? 0]
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-[var(--muted-foreground)]">{l}</span>
                  <span className={`font-medium ${l === "Net Payroll" ? "text-green-700" : ""}`}>{currency} {fmt(v as number)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><h2 className="font-semibold">Downloads</h2></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <a href={`/api/reports/payroll-runs/${id}/summary.xlsx`} download><Button variant="secondary">↓ Payroll Summary Excel</Button></a>
              <a href={`/api/reports/payroll-runs/${id}/nssf.xlsx`} download><Button variant="secondary">↓ {pensionLabel} Schedule</Button></a>
              <a href={`/api/reports/payroll-runs/${id}/bank-payment.csv`} download><Button variant="secondary">↓ Bank Payment CSV</Button></a>
              <a href={`/api/reports/p9a?year=${run.periodYear}`} download><Button variant="secondary">↓ P9A Annual Return</Button></a>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
