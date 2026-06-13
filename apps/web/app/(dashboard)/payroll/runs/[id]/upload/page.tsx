"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function UploadTimesheetPage() {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function getCsrf() {
    const r = await api<any>("/auth/csrf");
    return r.csrfToken as string;
  }

  async function handlePreview() {
    if (!file) return;
    setPreviewing(true); setError(""); setPreview(null);
    try {
      const csrf = await getCsrf();
      const fd = new FormData();
      fd.append("file", file);
      if (selectedSheet) fd.append("sheet", selectedSheet);
      const res = await fetch("/api/import/timesheet/preview", {
        method: "POST", credentials: "include",
        headers: { "x-csrf-token": csrf }, body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setPreview(await res.json());
    } catch (e: any) { setError(e.message); } finally { setPreviewing(false); }
  }

  async function handleApply() {
    if (!preview?.rows) return;
    setApplying(true); setError("");
    try {
      const csrf = await getCsrf();
      const res = await fetch(`/api/import/timesheet/apply/${id}`, {
        method: "POST", credentials: "include",
        headers: { "x-csrf-token": csrf, "content-type": "application/json" },
        body: JSON.stringify({ runId: id, rows: JSON.stringify(preview.rows) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setSuccess(`Applied ${result.applied} employee records. Return to the payroll run to verify calculations.`);
      setPreview(null); setFile(null);
    } catch (e: any) { setError(e.message); } finally { setApplying(false); }
  }

  return (
    <div className="grid gap-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-1">
          <Link href={`/payroll/runs/${id}`} className="hover:underline">← Back to Payroll Run</Link>
        </div>
        <h1 className="text-2xl font-bold">Upload Timesheet</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Upload the 7D Minerals Excel file. Supports both the "Timesheet Input" sheet and
          monthly payroll register sheets (e.g. "March"). Hours are imported and all statutory
          calculations are automatically recalculated.
        </p>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          <p className="font-medium">✓ {success}</p>
          <Link href={`/payroll/runs/${id}`}>
            <Button size="sm" className="mt-3">View Payroll Lines →</Button>
          </Link>
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>}

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Select File</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Upload the Profacc/7D Minerals payroll Excel workbook. The system detects the correct sheet automatically.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div
            className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-[var(--primary)] transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setPreview(null); } }}
          >
            <p className="text-4xl mb-3">{file ? "📊" : "📂"}</p>
            <p className="font-medium">{file ? file.name : "Click or drag Excel file here"}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Accepts .xlsx — Timesheet Input sheet or full payroll workbook
            </p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); }} />
          </div>

          {preview?.availableSheets?.length > 0 && (
            <div className="grid gap-1">
              <label className="text-sm font-medium">Override sheet (optional)</label>
              <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm"
                value={selectedSheet} onChange={(e) => { setSelectedSheet(e.target.value); setPreview(null); }}>
                <option value="">Auto-detect</option>
                {preview.availableSheets.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <Button onClick={handlePreview} disabled={!file || previewing} variant="secondary">
            {previewing ? "Reading file..." : "Preview Data"}
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-semibold">Preview — {preview.sheetName}</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {preview.month && `Period: ${preview.month}/${preview.year} · `}
                    {preview.workingDays && `${preview.workingDays} working days · `}
                    {preview.exchangeRate && `Rate: ${Number(preview.exchangeRate).toLocaleString()} TZS/USD`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    {preview.rows?.filter((r: any) => r.matched).length} matched
                  </span>
                  {preview.rows?.filter((r: any) => !r.matched).length > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                      {preview.rows?.filter((r: any) => !r.matched).length} unmatched
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr className="border-b bg-[var(--muted)]">
                    {["Code","Employee","Type","Act.Hrs","OT 1.5×","OT 2.0×","PH 2.0×","Standby","C/O 1.5×","C/O 2.0×","Deductions","Status"].map((h) => (
                      <th key={h} className="text-left px-2 py-2 font-medium text-[var(--muted-foreground)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows?.map((row: any) => (
                    <tr key={row.seq} className={`border-b last:border-0 ${!row.matched ? "bg-amber-50" : "hover:bg-[var(--muted)]"}`}>
                      <td className="px-2 py-1.5 font-mono">{row.employeeCode}</td>
                      <td className="px-2 py-1.5 font-medium">{row.employeeName}</td>
                      <td className="px-2 py-1.5">
                        <span className={`px-1 rounded text-xs ${row.payType === "HOURLY" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {row.payType}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right">{row.actualHours || "—"}</td>
                      <td className="px-2 py-1.5 text-right">{row.otHours || "—"}</td>
                      <td className="px-2 py-1.5 text-right">{row.ot20Hours || "—"}</td>
                      <td className="px-2 py-1.5 text-right">{row.phHours || "—"}</td>
                      <td className="px-2 py-1.5 text-right">{row.standbyDays || "—"}</td>
                      <td className="px-2 py-1.5 text-right">{row.callout15Hours || "—"}</td>
                      <td className="px-2 py-1.5 text-right">{row.callout20Hours || "—"}</td>
                      <td className="px-2 py-1.5 text-right">{row.otherDeductions ? Number(row.otherDeductions).toLocaleString() : "—"}</td>
                      <td className="px-2 py-1.5">
                        {row.matched
                          ? <span className="text-green-600 font-medium">✓</span>
                          : <span className="text-amber-600 text-xs">{row.errors?.[0]}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleApply} disabled={applying || !preview.rows?.some((r: any) => r.matched)}>
              {applying ? "Applying..." : `Apply ${preview.rows?.filter((r: any) => r.matched).length} rows to Payroll Run`}
            </Button>
            <Button variant="secondary" onClick={() => { setPreview(null); setFile(null); }}>Reset</Button>
          </div>
        </>
      )}

      <Card>
        <CardHeader><h2 className="font-semibold text-sm">Supported formats</h2></CardHeader>
        <CardContent className="grid gap-3 text-sm text-[var(--muted-foreground)]">
          <div className="rounded-lg border p-3">
            <p className="font-medium text-[var(--foreground)] mb-1">Timesheet Input sheet</p>
            <p>The standalone input register (row 4 = month, row 7+ = data). Columns: Day Hrs, OT 1.5×, OT 2.0×, PH 2.0×, Standby Days, Callout 1.5×, Callout 2.0×, Other Deductions.</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium text-[var(--foreground)] mb-1">Full payroll workbook (monthly sheets)</p>
            <p>Upload the entire 7D Minerals workbook and select the month (e.g. "March"). Input columns E, G, J, L, N, P, R, T, AB, AD are read per employee.</p>
          </div>
          <p className="text-xs border-t pt-2">
            After import, all statutory deductions (PAYE, NSSF, SDL, WCF) are recalculated automatically.
            Fixed salaries, allowances and rates are always taken from the employee master, not the spreadsheet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
