"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<any[]>("/employees")
      .then(setEmployees)
      .catch(() => setError("Failed to load employees."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) => {
    const name = (e.fullName ?? `${e.firstName} ${e.lastName}`).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || e.employeeNumber.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || e.employmentType === filter || e.contractType === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{employees.length} employees on payroll.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employees/import"><Button variant="secondary">↑ Import</Button></Link>
          <Link href="/employees/new"><Button>+ Add Employee</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1">
          {["ALL", "FIXED", "HOURLY", "Expert", "Citizen", "Contract"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <p className="text-[var(--muted-foreground)]">Loading employees...</p>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[var(--muted)]">
                  {["Code","Name","Title","Contract","Pay Type","Currency","Base Salary / Rate","Start Date","Status",""].map((h) => (
                    <th key={h} className="text-left px-3 py-3 font-medium text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-8 text-[var(--muted-foreground)]">No employees found.</td></tr>
                ) : (
                  filtered.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0 hover:bg-[var(--muted)] transition-colors">
                      <td className="px-3 py-2 font-mono text-xs">{emp.employeeNumber}</td>
                      <td className="px-3 py-2 font-medium">
                        <Link href={`/employees/${emp.id}`} className="text-[var(--primary)] hover:underline">
                          {emp.fullName ?? `${emp.firstName} ${emp.lastName}`}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-[var(--muted-foreground)]">{emp.title ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${emp.contractType === "Expert" ? "bg-purple-100 text-purple-700" : emp.contractType === "Contract" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}>
                          {emp.contractType}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${emp.employmentType === "HOURLY" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {emp.employmentType}
                        </span>
                      </td>
                      <td className="px-3 py-2">{emp.currency}</td>
                      <td className="px-3 py-2">
                        {emp.currency === "USD" && emp.usdSalary
                          ? `USD ${Number(emp.usdSalary).toLocaleString()}`
                          : emp.employmentType === "HOURLY" && emp.hourlyRate
                          ? `TZS ${fmt(Number(emp.hourlyRate))}/hr`
                          : `TZS ${fmt(Number(emp.baseSalary))}`}
                      </td>
                      <td className="px-3 py-2 text-[var(--muted-foreground)]">
                        {new Date(emp.startDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${emp.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {emp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/employees/${emp.id}/edit`}>
                          <Button size="sm" variant="secondary">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
