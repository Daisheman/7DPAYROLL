"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any>(`/employees/${id}`)
      .then(setEmployee)
      .catch(() => router.push("/employees"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-[var(--muted-foreground)]">Loading employee...</div>;
  if (!employee) return null;

  const tabs = ["Profile", "Salary History", "Leave", "Payslips", "YTD"];
  const fullName = employee.fullName ?? `${employee.firstName} ${employee.lastName}`;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-1">
            <Link href="/employees" className="hover:underline">Employees</Link>
            <span>/</span>
            <span>{fullName}</span>
          </div>
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {employee.employeeNumber} · {employee.title ?? "—"} · {employee.contractType}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/employees/${id}/edit`}><Button variant="secondary">Edit Employee</Button></Link>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex gap-2 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${employee.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {employee.isActive ? "Active" : "Inactive"}
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">{employee.employmentType}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">{employee.currency}</span>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.toLowerCase()
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><h2 className="font-semibold">Personal Details</h2></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {[
                ["Full Name", fullName],
                ["Employee Code", employee.employeeNumber],
                ["Title / Role", employee.title ?? "—"],
                ["Department", employee.department ?? "—"],
                ["Nationality", employee.nationality ?? "—"],
                ["Start Date", employee.startDate ? new Date(employee.startDate).toLocaleDateString("en-GB") : "—"],
                ["End Date", employee.endDate ? new Date(employee.endDate).toLocaleDateString("en-GB") : "Active"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-[var(--muted-foreground)]">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Pay Details</h2></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {[
                ["Employment Type", employee.employmentType],
                ["Contract Type", employee.contractType],
                ["Currency", employee.currency],
                ["Base Salary (TZS)", `TZS ${fmt(Number(employee.baseSalary))}`],
                ...(employee.usdSalary ? [["USD Salary", `USD ${Number(employee.usdSalary).toLocaleString()}`]] : []),
                ...(employee.hourlyRate ? [["Hourly Rate", `TZS ${fmt(Number(employee.hourlyRate))}`]] : []),
                ...(employee.stdHoursPerMonth ? [["Std Hours/Month", String(employee.stdHoursPerMonth)]] : []),
                ["Housing Allowance", `TZS ${fmt(Number(employee.housingAllowance ?? 0))}`],
                ["Transport Allowance", `TZS ${fmt(Number(employee.transportAllowance ?? 0))}`],
                ["Site Allowance", `TZS ${fmt(Number(employee.siteAllowance ?? 0))}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-[var(--muted-foreground)]">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Contact & Bank</h2></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {[
                ["Email", employee.email ?? "—"],
                ["Phone", employee.phone ?? "—"],
                ["Bank Name", employee.bankName ?? "—"],
                ["Account Number", employee.bankAccountNumber ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-[var(--muted-foreground)]">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Statutory Numbers</h2></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {[
                ["NSSF Number", employee.nssfNumber ?? "—"],
                ["Tax ID (TIN)", employee.taxIdentificationNumber ?? "—"],
                ["Notes", employee.notes ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-[var(--muted-foreground)]">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Salary History Tab */}
      {activeTab === "salary history" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold">Salary History</h2>
            <Link href={`/employees/${id}/edit`}><Button size="sm">Add Change</Button></Link>
          </CardHeader>
          <CardContent>
            {(!employee.salaryHistory || employee.salaryHistory.length === 0) ? (
              <p className="text-sm text-[var(--muted-foreground)]">No salary history recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Effective Date</th>
                    <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Pay Type</th>
                    <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Rate</th>
                    <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Currency</th>
                    <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.salaryHistory.map((h: any) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-2">{new Date(h.effectiveDate).toLocaleDateString("en-GB")}</td>
                      <td className="py-2">{h.payType}</td>
                      <td className="py-2 font-medium">{h.fixedSalaryTzs ? `TZS ${fmt(Number(h.fixedSalaryTzs))}` : h.hourlyRateTzs ? `TZS ${fmt(Number(h.hourlyRateTzs))}/hr` : "—"}</td>
                      <td className="py-2">{h.currency}</td>
                      <td className="py-2 text-[var(--muted-foreground)]">{h.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leave Tab */}
      {activeTab === "leave" && (() => {
        // Country-based entitlements
        const country = (employee.company?.country ?? "TZ").toUpperCase();
        const annualEntitlement = country === "BW" ? 15 : 28;
        const sickEntitlement   = country === "BW" ? 24 : 126;
        const accrualPerMonth   = Number((annualEntitlement / 12).toFixed(2));

        // Calculate tenure in months from start date to today
        const startDate  = new Date(employee.startDate);
        const today      = new Date();
        const tenureMs   = today.getTime() - startDate.getTime();
        const tenureMths = Math.max(0, Math.floor(tenureMs / (1000 * 60 * 60 * 24 * 30.44)));

        // Total accrued to date
        const totalAccrued = Number((accrualPerMonth * tenureMths).toFixed(2));

        // Leave taken from records
        const approved = (employee.leaveRequests ?? []).filter((l: any) => l.status === "APPROVED");
        const annualTaken = approved
          .filter((l: any) => l.type === "Annual")
          .reduce((s: number, l: any) => s + Number(l.days), 0);
        const sickTaken = approved
          .filter((l: any) => l.type === "Sick")
          .reduce((s: number, l: any) => s + Number(l.days), 0);
        const annualBalance = Math.max(0, Number((totalAccrued - annualTaken).toFixed(2)));
        const sickBalance   = Math.max(0, Number((sickEntitlement - sickTaken).toFixed(2)));

        return (
          <div className="grid gap-4">
            {/* Leave summary cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><h2 className="font-semibold">Annual Leave</h2></CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  {[
                    ["Entitlement", `${annualEntitlement} days / year`],
                    ["Accrued per month", `${accrualPerMonth} days`],
                    ["Total accrued to date", `${totalAccrued} days`],
                    ["Leave taken", `${annualTaken} days`],
                    ["Leave balance", `${annualBalance} days`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-[var(--muted-foreground)]">{label}</span>
                      <span className={`font-medium ${label === "Leave balance" ? (annualBalance > 0 ? "text-green-700" : "text-red-600") : ""}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><h2 className="font-semibold">Sick Leave</h2></CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  {[
                    ["Entitlement", `${sickEntitlement} days / year`],
                    ["Sick leave taken", `${sickTaken} days`],
                    ["Sick leave balance", `${sickBalance} days`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-[var(--muted-foreground)]">{label}</span>
                      <span className={`font-medium ${label === "Sick leave balance" ? "text-blue-700" : ""}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-[var(--muted-foreground)] pt-2">
                    Tenure: {Math.floor(tenureMths / 12)} yrs {tenureMths % 12} months
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Leave records */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="font-semibold">Leave History</h2>
                <Link href="/leave-management"><Button size="sm">Record Leave</Button></Link>
              </CardHeader>
              <CardContent>
                {approved.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">No approved leave records.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-[var(--muted)]">
                        {["Type","From","To","Days","Status"].map((h) => (
                          <th key={h} className="text-left px-2 py-2 font-medium text-[var(--muted-foreground)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(employee.leaveRequests ?? []).map((l: any) => (
                        <tr key={l.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                          <td className="px-2 py-2">{l.type}</td>
                          <td className="px-2 py-2">{new Date(l.startDate).toLocaleDateString("en-GB")}</td>
                          <td className="px-2 py-2">{new Date(l.endDate).toLocaleDateString("en-GB")}</td>
                          <td className="px-2 py-2 font-medium">{Number(l.days)}</td>
                          <td className="px-2 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              l.status === "APPROVED" ? "bg-green-100 text-green-800" :
                              l.status === "REJECTED" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"}`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Payslips Tab */}
      {activeTab === "payslips" && (
        <Card>
          <CardHeader><h2 className="font-semibold">Payslips</h2></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">Download payslips from locked payroll runs.</p>
            <Link href="/payslips"><Button variant="secondary">Go to Payslips</Button></Link>
          </CardContent>
        </Card>
      )}

      {/* YTD Tab */}
      {activeTab === "ytd" && (
        <Card>
          <CardHeader><h2 className="font-semibold">Year to Date Summary</h2></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">YTD figures are available after payroll runs are locked.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
