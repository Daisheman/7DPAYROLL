"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type EmployeeFormProps = {
  employee?: Record<string, any>;
};

const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

export function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setSaving(true);
    setError("");
    const fullName = text(formData.get("fullName"));
    const [firstName, ...rest] = fullName.trim().split(" ");
    const body = {
      employeeNumber: formData.get("employeeNumber"),
      fullName,
      firstName,
      lastName: rest.join(" ") || firstName,
      title: formData.get("title"),
      contractType: formData.get("contractType"),
      employmentType: formData.get("employmentType"),
      currency: formData.get("currency"),
      baseSalary: Number(formData.get("baseSalary") || 0),
      usdSalary: Number(formData.get("usdSalary") || 0) || undefined,
      hourlyRate: Number(formData.get("hourlyRate") || 0) || undefined,
      stdHoursPerMonth: Number(formData.get("stdHoursPerMonth") || 0) || undefined,
      housingAllowance: Number(formData.get("housingAllowance") || 0) || undefined,
      transportAllowance: Number(formData.get("transportAllowance") || 0) || undefined,
      siteAllowance: Number(formData.get("siteAllowance") || 0) || undefined,
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate") || undefined,
      nationality: formData.get("nationality"),
      bankName: formData.get("bankName"),
      bankAccountNumber: formData.get("bankAccountNumber"),
      nssfNumber: formData.get("nssfNumber"),
      taxIdentificationNumber: formData.get("taxIdentificationNumber"),
      notes: formData.get("notes"),
    };
    try {
      if (employee?.id) {
        await api(`/employees/${employee.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await api("/employees", { method: "POST", body: JSON.stringify(body) });
      }
      router.push("/employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save employee");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold">{employee ? "Edit employee" : "New employee"}</h1>
      </CardHeader>
      <CardContent>
        <form action={submit} className="grid gap-4 md:grid-cols-3">
          <Input name="employeeNumber" required placeholder="Employee Code" defaultValue={text(employee?.employeeNumber)} />
          <Input name="fullName" required placeholder="Full Name" defaultValue={text(employee?.fullName ?? `${employee?.firstName ?? ""} ${employee?.lastName ?? ""}`).trim()} />
          <Input name="title" placeholder="Title/Role" defaultValue={text(employee?.title)} />
          <select name="contractType" defaultValue={text(employee?.contractType ?? "Citizen")} className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm">
            <option>Expert</option><option>Citizen</option><option>Contract</option>
          </select>
          <select name="employmentType" defaultValue={text(employee?.employmentType ?? "HOURLY")} className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm">
            <option>FIXED</option><option>HOURLY</option>
          </select>
          <select name="currency" defaultValue={text(employee?.currency ?? "TZS")} className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm">
            <option>TZS</option><option>USD</option>
          </select>
          <Input name="baseSalary" type="number" step="0.01" placeholder="Fixed Salary TZS" defaultValue={text(employee?.baseSalary ?? 0)} />
          <Input name="usdSalary" type="number" step="0.01" placeholder="USD Salary" defaultValue={text(employee?.usdSalary)} />
          <Input name="hourlyRate" type="number" step="0.01" placeholder="Hourly Rate TZS (per hour)" defaultValue={text(employee?.hourlyRate)} title="Set the base hourly rate. Only change if the rate has changed." />
          <Input name="stdHoursPerMonth" type="text" inputMode="numeric" placeholder="Standard Hours/Month (e.g. 234)" defaultValue={text(employee?.stdHoursPerMonth ?? 234)} />
          <Input name="housingAllowance" type="number" step="0.01" placeholder="Housing Allowance" defaultValue={text(employee?.housingAllowance)} />
          <Input name="transportAllowance" type="number" step="0.01" placeholder="Transport Allowance" defaultValue={text(employee?.transportAllowance)} />
          <Input name="siteAllowance" type="number" step="0.01" placeholder="Site Allowance" defaultValue={text(employee?.siteAllowance)} />
          <Input name="startDate" type="date" required defaultValue={text(employee?.startDate).slice(0, 10)} />
          <Input name="endDate" type="date" defaultValue={text(employee?.endDate).slice(0, 10)} />
          <Input name="nationality" placeholder="Nationality" defaultValue={text(employee?.nationality)} />
          <Input name="bankName" placeholder="Bank Name" defaultValue={text(employee?.bankName)} />
          <Input name="bankAccountNumber" placeholder="Bank Account Number" defaultValue={text(employee?.bankAccountNumber)} />
          <Input name="nssfNumber" placeholder="NSSF Number" defaultValue={text(employee?.nssfNumber)} />
          <Input name="taxIdentificationNumber" placeholder="TIN" defaultValue={text(employee?.taxIdentificationNumber)} />
          <textarea name="notes" placeholder="Notes" defaultValue={text(employee?.notes)} className="min-h-24 rounded-md border bg-[var(--card)] p-3 text-sm md:col-span-3" />
          {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}
          <Button className="md:col-span-3" disabled={saving}>{saving ? "Saving..." : "Save employee"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
