"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ImportEmployeesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handlePreview() {
    if (!file) return;
    setPreviewing(true);
    setError("");
    setPreview([]);
    try {
      // Get CSRF token first
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
      const { csrfToken } = await csrfRes.json();

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import/employees/preview", {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": csrfToken },
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setPreview(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError("");
    setSuccess("");
    try {
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
      const { csrfToken } = await csrfRes.json();

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import/employees", {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": csrfToken },
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setSuccess(`Successfully imported ${result.length} employees.`);
      setPreview([]);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const validRows = preview.filter((r) => r.errors.length === 0);
  const errorRows = preview.filter((r) => r.errors.length > 0);

  return (
    <div className="grid gap-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-1">
          <Link href="/employees" className="hover:underline">Employees</Link>
          <span>/</span>
          <span>Import</span>
        </div>
        <h1 className="text-2xl font-bold">Import Employees</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Upload a Profacc Employee Setup spreadsheet. Data starts from row 8.
        </p>
      </div>

      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>}

      <Card>
        <CardHeader><h2 className="font-semibold">Upload Spreadsheet</h2></CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[var(--primary)] transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) setFile(f);
              }}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <p className="text-2xl mb-2">📂</p>
              <p className="font-medium">{file ? file.name : "Click or drag to upload"}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Accepts .xlsx files only</p>
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handlePreview} disabled={!file || previewing} variant="secondary">
                {previewing ? "Previewing..." : "Preview Data"}
              </Button>
              {preview.length > 0 && (
                <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
                  {importing ? "Importing..." : `Import ${validRows.length} Employees`}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview table */}
      {preview.length > 0 && (
        <>
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800">{validRows.length} ready to import</span>
            {errorRows.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800">{errorRows.length} have errors</span>
            )}
          </div>
          <Card>
            <CardHeader><h2 className="font-semibold">Preview</h2></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[var(--muted)]">
                    {["Row","Code","Name","Type","Currency","Base Salary","Start Date","Status"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.row} className={`border-b last:border-0 ${row.errors.length > 0 ? "bg-red-50" : "hover:bg-[var(--muted)]"}`}>
                      <td className="px-3 py-2">{row.row}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.employeeNumber}</td>
                      <td className="px-3 py-2">{row.fullName}</td>
                      <td className="px-3 py-2">{row.employmentType}</td>
                      <td className="px-3 py-2">{row.currency}</td>
                      <td className="px-3 py-2">{Number(row.baseSalary).toLocaleString()}</td>
                      <td className="px-3 py-2">{row.startDate ? new Date(row.startDate).toLocaleDateString("en-GB") : "—"}</td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 ? (
                          <span className="text-xs text-red-600">{row.errors.join(", ")}</span>
                        ) : (
                          <span className="text-xs text-green-600">✓ Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Format guide */}
      <Card>
        <CardHeader><h2 className="font-semibold text-sm">Spreadsheet Format</h2></CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)] grid gap-1">
          <p>• Data starts from <strong>row 8</strong> (rows 1-7 are headers)</p>
          <p>• Column B: Full Name | Column C: Employee Code | Column D: Pay Type (FIXED/HOURLY)</p>
          <p>• Column E: Title | Column F: Contract Type | Column G: Base Salary | Column H: Hourly Rate</p>
          <p>• Column M: Start Date | Column N: Nationality | Column P: Currency | Column Q: USD Salary</p>
          <p>• Existing employees (matched by code) will be updated, not duplicated.</p>
        </CardContent>
      </Card>
    </div>
  );
}
