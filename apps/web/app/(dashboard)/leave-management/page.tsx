"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const LEAVE_TYPES = ["Annual", "Sick", "Maternity", "Paternity", "Compassionate", "Unpaid", "Other"];

export default function LeaveManagementPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("records");
  const [empSearch, setEmpSearch] = useState("");
  const [form, setForm] = useState({
    employeeId: "", type: "Annual", startDate: "", endDate: "", days: "", payRate: "1", notes: "",
  });

  useEffect(() => {
    api<any[]>("/employees").then(setEmployees).catch(() => {});
    loadLeaves();
  }, []);

  async function loadLeaves() {
    try { setLeaves(await api<any[]>("/leave")); } catch { setLeaves([]); }
  }

  function autoCalcDays() {
    if (!form.startDate || !form.endDate || form.days) return; // don't overwrite manual entry
    const diff = Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1;
    if (diff > 0) setForm((f) => ({ ...f, days: String(diff) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.days || Number(form.days) <= 0) { setError("Please enter the number of days taken."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api("/leave", {
        method: "POST",
        body: JSON.stringify({
          employeeId: form.employeeId, type: form.type,
          startDate: form.startDate, endDate: form.endDate || form.startDate,
          days: Number(form.days), payRate: Number(form.payRate), notes: form.notes,
        }),
      });
      setSuccess("Leave record saved successfully.");
      setShowForm(false);
      setForm({ employeeId: "", type: "Annual", startDate: "", endDate: "", days: "", payRate: "1", notes: "" });
      loadLeaves();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save leave"); }
    finally { setSaving(false); }
  }

  // Country-based entitlements (default TZ)
  const getEntitlement = (emp: any) => {
    const country = (emp.company?.country ?? "TZ").toUpperCase();
    return {
      annual: country === "BW" ? 15 : 28,
      sick: country === "BW" ? 24 : 126,
      accrualPerMonth: country === "BW" ? Number((15/12).toFixed(2)) : Number((28/12).toFixed(2)),
    };
  };

  const getTenureMonths = (startDate: string) => {
    const ms = new Date().getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44)));
  };

  // Filter employees by search
  const filteredEmps = employees.filter((e) => {
    if (!empSearch) return true;
    const name = (e.fullName ?? `${e.firstName} ${e.lastName}`).toLowerCase();
    return name.includes(empSearch.toLowerCase()) || e.employeeNumber.toLowerCase().includes(empSearch.toLowerCase());
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track annual, sick, and other leave for all employees.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Record Leave"}</Button>
      </div>

      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>}

      {/* Add Leave Form */}
      {showForm && (
        <Card>
          <CardHeader><h2 className="font-semibold">Record Leave</h2></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">

              {/* Employee with search */}
              <div className="grid gap-1 md:col-span-2">
                <label className="text-sm font-medium">Employee *</label>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input placeholder="Search by name or code..." value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)} />
                  <select required value={form.employeeId}
                    onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                    className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm">
                    <option value="">Select employee...</option>
                    {filteredEmps.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeNumber} — {emp.fullName ?? `${emp.firstName} ${emp.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Leave Type *</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm">
                  {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Days — primary input */}
              <div className="grid gap-1">
                <label className="text-sm font-medium text-[var(--primary)]">
                  Days Taken * <span className="text-xs font-normal text-[var(--muted-foreground)]">(this is what gets deducted)</span>
                </label>
                <Input type="number" min={0.5} step={0.5} required placeholder="e.g. 5"
                  value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))}
                  className="border-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  onBlur={autoCalcDays} />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  onBlur={autoCalcDays} />
                <p className="text-xs text-[var(--muted-foreground)]">Optional — dates are for reference only. Days taken = the number you entered above.</p>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Pay Rate</label>
                <select value={form.payRate} onChange={(e) => setForm((f) => ({ ...f, payRate: e.target.value }))}
                  className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm">
                  <option value="1">Full Pay (100%)</option>
                  <option value="0.5">Half Pay (50%)</option>
                  <option value="0">Unpaid (0%)</option>
                </select>
              </div>

              <div className="grid gap-1 md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Leave Record"}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {[["records","Leave Records"],["balances","Leave Balances"]].map(([t, l]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Leave Records */}
      {activeTab === "records" && (
        <Card>
          <CardContent className="overflow-x-auto pt-4">
            {leaves.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No leave records yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[var(--muted)]">
                    {["Employee","Type","From","To","Days","Pay Rate","Status","Notes"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => {
                    const emp = employees.find((e) => e.id === l.employeeId);
                    return (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                        <td className="px-3 py-2 font-medium">{emp?.fullName ?? emp?.firstName ?? l.employeeId}</td>
                        <td className="px-3 py-2">{l.type}</td>
                        <td className="px-3 py-2">{new Date(l.startDate).toLocaleDateString("en-GB")}</td>
                        <td className="px-3 py-2">{new Date(l.endDate).toLocaleDateString("en-GB")}</td>
                        <td className="px-3 py-2 font-bold">{Number(l.days)}</td>
                        <td className="px-3 py-2">{Number(l.payRate) === 1 ? "Full" : Number(l.payRate) === 0.5 ? "Half" : "Unpaid"}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{l.status}</span>
                        </td>
                        <td className="px-3 py-2 text-[var(--muted-foreground)]">{l.notes ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leave Balances - full breakdown */}
      {activeTab === "balances" && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Leave Balances — All Employees</h2>
            <p className="text-xs text-[var(--muted-foreground)]">TZ: 28 days/yr annual · 126 days/yr sick · BW: 15 days/yr annual · 24 days/yr sick</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b bg-[var(--muted)]">
                  {["Code","Employee","Start Date","Tenure","Annual Entitlement","Accrued/Month","Total Accrued","Annual Taken","Annual Balance","Sick Entitlement","Sick Taken","Sick Balance"].map((h) => (
                    <th key={h} className="text-left px-2 py-2 font-medium text-[var(--muted-foreground)] text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const ent = getEntitlement(emp);
                  const tenureMths = getTenureMonths(emp.startDate);
                  const totalAccrued = Number((ent.accrualPerMonth * tenureMths).toFixed(2));
                  const empLeaves = leaves.filter((l) => l.employeeId === emp.id && l.status === "APPROVED");
                  const annualTaken = empLeaves.filter((l) => l.type === "Annual").reduce((s, l) => s + Number(l.days), 0);
                  const sickTaken   = empLeaves.filter((l) => l.type === "Sick").reduce((s, l) => s + Number(l.days), 0);
                  const annualBalance = Math.max(0, Number((totalAccrued - annualTaken).toFixed(2)));
                  const sickBalance   = Math.max(0, ent.sick - sickTaken);
                  const tenureYrs = Math.floor(tenureMths / 12);
                  const tenureMo  = tenureMths % 12;

                  return (
                    <tr key={emp.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                      <td className="px-2 py-2 font-mono text-xs">{emp.employeeNumber}</td>
                      <td className="px-2 py-2 font-medium">{emp.fullName ?? `${emp.firstName} ${emp.lastName}`}</td>
                      <td className="px-2 py-2 text-xs text-[var(--muted-foreground)]">{new Date(emp.startDate).toLocaleDateString("en-GB")}</td>
                      <td className="px-2 py-2 text-xs">{tenureYrs}y {tenureMo}m</td>
                      <td className="px-2 py-2 text-center">{ent.annual} days/yr</td>
                      <td className="px-2 py-2 text-center text-blue-700">{ent.accrualPerMonth} days</td>
                      <td className="px-2 py-2 text-center">{totalAccrued} days</td>
                      <td className="px-2 py-2 text-center text-red-600">{annualTaken} days</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`font-bold ${annualBalance > 0 ? "text-green-700" : "text-red-600"}`}>{annualBalance} days</span>
                      </td>
                      <td className="px-2 py-2 text-center">{ent.sick} days/yr</td>
                      <td className="px-2 py-2 text-center text-red-600">{sickTaken} days</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`font-bold ${sickBalance > 0 ? "text-blue-700" : "text-red-600"}`}>{sickBalance} days</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
