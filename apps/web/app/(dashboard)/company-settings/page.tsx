"use client";

// ── Sage Guide Ch. 4 + Ch. 5: Earnings Codes + Deduction Codes ──────────────
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Tab = "company" | "earnings" | "deductions";

const EARNINGS_TYPES = ["REGULAR", "OVERTIME", "DOUBLE_OT", "BONUS", "COMMISSION", "ALLOWANCE", "REIMBURSEMENT", "FRINGE"];
const DEDUCTION_TYPES = ["LOAN", "ADVANCE", "MEDICAL_AID", "UNION_FEE", "GARNISHMENT", "PENSION_EXTRA", "OTHER"];
const TAX_RULES = ["TAXABLE", "NON_TAXABLE", "SUPPLEMENTAL"];

export default function CompanySettingsPage() {
  const [tab, setTab] = useState<Tab>("company");
  const [company, setCompany] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Earnings codes state
  const [earningsCodes, setEarningsCodes] = useState<any[]>([]);
  const [ecForm, setEcForm] = useState({ code: "", description: "", earningsType: "REGULAR", taxRule: "TAXABLE", glAccount: "" });
  const [ecSaving, setEcSaving] = useState(false);

  // Deduction codes state
  const [deductionCodes, setDeductionCodes] = useState<any[]>([]);
  const [dcForm, setDcForm] = useState({ code: "", description: "", deductionType: "LOAN", calculationType: "FIXED", defaultAmount: "", glAccount: "" });
  const [dcSaving, setDcSaving] = useState(false);

  useEffect(() => {
    api<any>("/company").then((c) => {
      setCompany(c);
      setForm({
        name: c.name ?? "", registration: c.registration ?? "", contract: c.contract ?? "",
        taxNumber: c.taxNumber ?? "", nssfReg: c.nssfReg ?? "", wcfReg: c.wcfReg ?? "",
        taxYear: c.taxYear ?? "2025/26", country: c.country ?? "TZ",
        address: c.address ?? "", email: c.email ?? "", phone: c.phone ?? "",
        workingDays: c.workingDays ?? 26, stdHoursPerDay: c.stdHoursPerDay ?? 9,
      });
    });
    api<any[]>("/earnings-codes").then(setEarningsCodes).catch(() => {});
    api<any[]>("/deduction-codes").then(setDeductionCodes).catch(() => {});
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f: any) => ({ ...f, [key]: e.target.value }));

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await api("/company/settings", { method: "PATCH", body: JSON.stringify(form) });
      setSuccess("Settings saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  async function saveEarningsCode(e: React.FormEvent) {
    e.preventDefault();
    setEcSaving(true);
    try {
      const created = await api<any>("/earnings-codes", { method: "POST", body: JSON.stringify(ecForm) });
      setEarningsCodes((prev) => [...prev, created]);
      setEcForm({ code: "", description: "", earningsType: "REGULAR", taxRule: "TAXABLE", glAccount: "" });
      setSuccess("Earnings code created.");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setEcSaving(false); }
  }

  async function saveDeductionCode(e: React.FormEvent) {
    e.preventDefault();
    setDcSaving(true);
    try {
      const created = await api<any>("/deduction-codes", { method: "POST", body: JSON.stringify({
        ...dcForm,
        defaultAmount: dcForm.defaultAmount ? Number(dcForm.defaultAmount) : undefined,
      }) });
      setDeductionCodes((prev) => [...prev, created]);
      setDcForm({ code: "", description: "", deductionType: "LOAN", calculationType: "FIXED", defaultAmount: "", glAccount: "" });
      setSuccess("Deduction code created.");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setDcSaving(false); }
  }

  async function toggleEarningsCode(id: string, isActive: boolean) {
    await api(`/earnings-codes/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) });
    setEarningsCodes((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !isActive } : c));
  }

  async function toggleDeductionCode(id: string, isActive: boolean) {
    await api(`/deduction-codes/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) });
    setDeductionCodes((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !isActive } : c));
  }

  if (!company) return <div className="p-8 text-[var(--muted-foreground)]">Loading...</div>;

  return (
    <div className="grid gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Company Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage company profile, earnings codes, and deduction codes.</p>
      </div>

      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>}

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {([["company", "🏢 Company"], ["earnings", "💰 Earnings Codes"], ["deductions", "➖ Deduction Codes"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Company tab */}
      {tab === "company" && (
        <form onSubmit={saveCompany} className="grid gap-6">
          <Card>
            <CardHeader><h2 className="font-semibold">Company Profile</h2></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[["Company Name","name"],["Registration Number","registration"],["Contract Name","contract"],["Tax Year","taxYear"]].map(([l,k]) => (
                <div key={k} className="grid gap-1">
                  <label className="text-sm font-medium">{l}</label>
                  <Input value={form[k] ?? ""} onChange={set(k)} />
                </div>
              ))}
              <div className="grid gap-1"><label className="text-sm font-medium">Country</label>
                <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={form.country ?? "TZ"} onChange={set("country")}>
                  {["TZ","BW","ZA","ZW","OTHER"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {[["Address","address"],["Contact Email","email"],["Phone","phone"]].map(([l,k]) => (
                <div key={k} className="grid gap-1"><label className="text-sm font-medium">{l}</label><Input value={form[k] ?? ""} onChange={set(k)} /></div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Statutory Registration</h2></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[["PAYE / Tax Number","taxNumber"],["NSSF Registration No.","nssfReg"],["WCF Registration No.","wcfReg"]].map(([l,k]) => (
                <div key={k} className="grid gap-1"><label className="text-sm font-medium">{l}</label><Input value={form[k] ?? ""} onChange={set(k)} /></div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Payroll Defaults</h2></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1"><label className="text-sm font-medium">Standard Working Days / Month</label><Input type="number" value={form.workingDays ?? 26} onChange={set("workingDays")} /></div>
              <div className="grid gap-1"><label className="text-sm font-medium">Standard Hours / Day</label><Input type="number" value={form.stdHoursPerDay ?? 9} onChange={set("stdHoursPerDay")} /></div>
            </CardContent>
          </Card>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
        </form>
      )}

      {/* Earnings Codes tab (Sage Guide Ch. 4) */}
      {tab === "earnings" && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Add Earnings Code</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Configure earnings types beyond the standard pay components. Sage Guide Ch. 4.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveEarningsCode} className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-1"><label className="text-sm font-medium">Code *</label>
                  <Input placeholder="e.g. COMM01" required value={ecForm.code} onChange={(e) => setEcForm((f) => ({ ...f, code: e.target.value }))} />
                </div>
                <div className="grid gap-1 md:col-span-2"><label className="text-sm font-medium">Description *</label>
                  <Input placeholder="e.g. Sales Commission" required value={ecForm.description} onChange={(e) => setEcForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid gap-1"><label className="text-sm font-medium">Earnings Type</label>
                  <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={ecForm.earningsType} onChange={(e) => setEcForm((f) => ({ ...f, earningsType: e.target.value }))}>
                    {EARNINGS_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid gap-1"><label className="text-sm font-medium">Tax Rule</label>
                  <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={ecForm.taxRule} onChange={(e) => setEcForm((f) => ({ ...f, taxRule: e.target.value }))}>
                    {TAX_RULES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid gap-1"><label className="text-sm font-medium">GL Account (optional)</label>
                  <Input placeholder="e.g. 5100" value={ecForm.glAccount} onChange={(e) => setEcForm((f) => ({ ...f, glAccount: e.target.value }))} />
                </div>
                <Button type="submit" disabled={ecSaving} className="md:col-span-3">{ecSaving ? "Saving..." : "+ Add Earnings Code"}</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Earnings Codes ({earningsCodes.length})</h2></CardHeader>
            <CardContent className="overflow-x-auto">
              {earningsCodes.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No earnings codes defined yet. Add one above.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-[var(--muted)]">
                    {["Code","Description","Type","Tax Rule","GL Account","Status",""].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)] text-xs">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {earningsCodes.map((ec) => (
                      <tr key={ec.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                        <td className="px-3 py-2 font-mono text-xs font-bold">{ec.code}</td>
                        <td className="px-3 py-2">{ec.description}</td>
                        <td className="px-3 py-2"><span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{ec.earningsType}</span></td>
                        <td className="px-3 py-2"><span className={`text-xs px-1.5 py-0.5 rounded ${ec.taxRule === "TAXABLE" ? "bg-red-100 text-red-700" : ec.taxRule === "NON_TAXABLE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{ec.taxRule}</span></td>
                        <td className="px-3 py-2 text-[var(--muted-foreground)]">{ec.glAccount || "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${ec.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{ec.isActive ? "Active" : "Inactive"}</span>
                        </td>
                        <td className="px-3 py-2">
                          <button className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]" onClick={() => toggleEarningsCode(ec.id, ec.isActive)}>
                            {ec.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deduction Codes tab (Sage Guide Ch. 5) */}
      {tab === "deductions" && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Add Deduction Code</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Configure loan repayments, salary advances, medical aid, union fees and other deductions. Sage Guide Ch. 5.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveDeductionCode} className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-1"><label className="text-sm font-medium">Code *</label>
                  <Input placeholder="e.g. LOAN01" required value={dcForm.code} onChange={(e) => setDcForm((f) => ({ ...f, code: e.target.value }))} />
                </div>
                <div className="grid gap-1 md:col-span-2"><label className="text-sm font-medium">Description *</label>
                  <Input placeholder="e.g. Housing Loan Repayment" required value={dcForm.description} onChange={(e) => setDcForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid gap-1"><label className="text-sm font-medium">Deduction Type</label>
                  <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={dcForm.deductionType} onChange={(e) => setDcForm((f) => ({ ...f, deductionType: e.target.value }))}>
                    {DEDUCTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid gap-1"><label className="text-sm font-medium">Calculation Type</label>
                  <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={dcForm.calculationType} onChange={(e) => setDcForm((f) => ({ ...f, calculationType: e.target.value }))}>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="PERCENTAGE">Percentage of Gross</option>
                  </select>
                </div>
                <div className="grid gap-1"><label className="text-sm font-medium">Default Amount / Rate</label>
                  <Input type="number" step="0.01" placeholder="e.g. 1500" value={dcForm.defaultAmount} onChange={(e) => setDcForm((f) => ({ ...f, defaultAmount: e.target.value }))} />
                </div>
                <div className="grid gap-1"><label className="text-sm font-medium">GL Account (optional)</label>
                  <Input placeholder="e.g. 2100" value={dcForm.glAccount} onChange={(e) => setDcForm((f) => ({ ...f, glAccount: e.target.value }))} />
                </div>
                <Button type="submit" disabled={dcSaving} className="md:col-span-3">{dcSaving ? "Saving..." : "+ Add Deduction Code"}</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Deduction Codes ({deductionCodes.length})</h2></CardHeader>
            <CardContent className="overflow-x-auto">
              {deductionCodes.length === 0 ? (
                <div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-2">No deduction codes defined yet. Examples:</p>
                  <div className="grid gap-2 text-xs text-[var(--muted-foreground)] border rounded-lg p-3">
                    <p>• <strong>LOAN01</strong> — Housing Loan Repayment (FIXED, P1,500/month)</p>
                    <p>• <strong>ADV01</strong> — Salary Advance Recovery (FIXED, P500/month)</p>
                    <p>• <strong>MED01</strong> — Medical Aid Premium (FIXED, P850/month)</p>
                    <p>• <strong>UNION</strong> — Union Subscription Fee (FIXED, P50/month)</p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-[var(--muted)]">
                    {["Code","Description","Type","Calc","Default Amt","GL Account","Status",""].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)] text-xs">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {deductionCodes.map((dc) => (
                      <tr key={dc.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                        <td className="px-3 py-2 font-mono text-xs font-bold">{dc.code}</td>
                        <td className="px-3 py-2">{dc.description}</td>
                        <td className="px-3 py-2"><span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">{dc.deductionType}</span></td>
                        <td className="px-3 py-2 text-[var(--muted-foreground)]">{dc.calculationType}</td>
                        <td className="px-3 py-2">{dc.defaultAmount ? Number(dc.defaultAmount).toLocaleString() : "—"}</td>
                        <td className="px-3 py-2 text-[var(--muted-foreground)]">{dc.glAccount || "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${dc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{dc.isActive ? "Active" : "Inactive"}</span>
                        </td>
                        <td className="px-3 py-2">
                          <button className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]" onClick={() => toggleDeductionCode(dc.id, dc.isActive)}>
                            {dc.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
