"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api<any>(`/employees/${id}`).then((emp) => {
      setEmployee(emp);
      setForm({
        employeeNumber: emp.employeeNumber,
        fullName: emp.fullName ?? `${emp.firstName} ${emp.lastName}`,
        title: emp.title ?? "",
        department: emp.department ?? "",
        contractType: emp.contractType,
        employmentType: emp.employmentType,
        currency: emp.currency,
        baseSalary: emp.baseSalary,
        usdSalary: emp.usdSalary ?? "",
        hourlyRate: emp.hourlyRate ?? "",
        stdHoursPerMonth: emp.stdHoursPerMonth ?? "",
        housingAllowance: emp.housingAllowance ?? "",
        transportAllowance: emp.transportAllowance ?? "",
        siteAllowance: emp.siteAllowance ?? "",
        standbyDailyRate: emp.standbyDailyRate ?? "",
        startDate: emp.startDate ? emp.startDate.substring(0, 10) : "",
        endDate: emp.endDate ? emp.endDate.substring(0, 10) : "",
        nationality: emp.nationality ?? "",
        bankName: emp.bankName ?? "",
        bankAccountNumber: emp.bankAccountNumber ?? "",
        nssfNumber: emp.nssfNumber ?? "",
        taxIdentificationNumber: emp.taxIdentificationNumber ?? "",
        email: emp.email ?? "",
        phone: emp.phone ?? "",
        notes: emp.notes ?? "",
      });
    }).catch(() => router.push("/employees"));
  }, [id]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const [firstName, ...rest] = (form.fullName as string).trim().split(" ");
      await api(`/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          firstName,
          lastName: rest.join(" ") || firstName,
          baseSalary: Number(form.baseSalary) || 0,
          usdSalary: Number(form.usdSalary) || undefined,
          hourlyRate: Number(form.hourlyRate) || undefined,
          stdHoursPerMonth: Number(form.stdHoursPerMonth) || undefined,
          housingAllowance: Number(form.housingAllowance) || undefined,
          transportAllowance: Number(form.transportAllowance) || undefined,
          siteAllowance: Number(form.siteAllowance) || undefined,
          standbyDailyRate: Number(form.standbyDailyRate) || undefined,
          endDate: form.endDate || undefined,
        }),
      });
      setSuccess("Employee updated successfully.");
      setTimeout(() => router.push(`/employees/${id}`), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!employee) return <div className="p-8 text-[var(--muted-foreground)]">Loading...</div>;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader><h2 className="font-semibold">{title}</h2></CardHeader>
      <CardContent><div className="grid gap-4 md:grid-cols-2">{children}</div></CardContent>
    </Card>
  );

  const Field = ({ label, name, type = "text", required = false, options }: {
    label: string; name: string; type?: string; required?: boolean; options?: string[];
  }) => (
    <div className="grid gap-1">
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      {options ? (
        <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={form[name] ?? ""} onChange={set(name)}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <Input type={type} value={form[name] ?? ""} onChange={set(name)} required={required} />
      )}
    </div>
  );

  return (
    <div className="grid gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-1">
            <Link href="/employees" className="hover:underline">Employees</Link>
            <span>/</span>
            <Link href={`/employees/${id}`} className="hover:underline">{employee.fullName ?? employee.firstName}</Link>
            <span>/</span>
            <span>Edit</span>
          </div>
          <h1 className="text-2xl font-bold">Edit Employee</h1>
        </div>
      </div>

      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>}

      <form onSubmit={submit} className="grid gap-6">
        <Section title="Personal Details">
          <Field label="Employee Code" name="employeeNumber" required />
          <Field label="Full Name" name="fullName" required />
          <Field label="Title / Role" name="title" />
          <Field label="Department" name="department" />
          <Field label="Nationality" name="nationality" />
          <Field label="Email" name="email" type="email" />
          <Field label="Phone" name="phone" type="tel" />
          <Field label="Start Date" name="startDate" type="date" required />
          <Field label="End Date (leave blank if active)" name="endDate" type="date" />
        </Section>

        <Section title="Pay Details">
          <Field label="Contract Type" name="contractType" options={["Citizen","Expert","Contract"]} />
          <Field label="Employment Type" name="employmentType" options={["FIXED","HOURLY","DAILY"]} />
          <Field label="Pay Currency" name="currency" options={["TZS","USD","BWP","ZAR"]} />
          <Field label="Base Salary (TZS)" name="baseSalary" type="number" />
          <Field label="USD Salary (if paid in USD)" name="usdSalary" type="number" />
          <Field label="Hourly Rate (TZS, if HOURLY)" name="hourlyRate" type="number" />
          <Field label="Std Hours / Month" name="stdHoursPerMonth" type="number" />
          <Field label="Standby Daily Rate (TZS)" name="standbyDailyRate" type="number" />
        </Section>

        <Section title="Allowances">
          <Field label="Housing Allowance (TZS/month)" name="housingAllowance" type="number" />
          <Field label="Transport Allowance (TZS/month)" name="transportAllowance" type="number" />
          <Field label="Site Allowance (TZS/month)" name="siteAllowance" type="number" />
        </Section>

        <Section title="Bank & Statutory">
          <Field label="Bank Name" name="bankName" />
          <Field label="Bank Account Number" name="bankAccountNumber" />
          <Field label="NSSF Number" name="nssfNumber" />
          <Field label="Tax ID (TIN)" name="taxIdentificationNumber" />
        </Section>

        <Card>
          <CardHeader><h2 className="font-semibold">Notes</h2></CardHeader>
          <CardContent>
            <textarea
              className="w-full rounded-md border bg-[var(--card)] px-3 py-2 text-sm min-h-[80px]"
              value={form.notes ?? ""}
              onChange={set("notes")}
              placeholder="Internal notes about this employee..."
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Link href={`/employees/${id}`}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
