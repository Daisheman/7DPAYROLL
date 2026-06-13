"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState<any>({
    employeeNumber: "",
    fullName: "",
    title: "",
    department: "",
    contractType: "Citizen",
    employmentType: "FIXED",
    currency: "TZS",
    baseSalary: "",
    usdSalary: "",
    hourlyRate: "",
    stdHoursPerMonth: "234",
    housingAllowance: "",
    transportAllowance: "",
    siteAllowance: "",
    standbyDailyRate: "",
    startDate: "",
    nationality: "",
    bankName: "",
    bankAccountNumber: "",
    nssfNumber: "",
    taxIdentificationNumber: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const [firstName, ...rest] = (form.fullName as string).trim().split(" ");
      const emp = await api<any>("/employees", {
        method: "POST",
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
        }),
      });
      router.push(`/employees/${emp.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setSaving(false);
    }
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader><h2 className="font-semibold">{title}</h2></CardHeader>
      <CardContent><div className="grid gap-4 md:grid-cols-2">{children}</div></CardContent>
    </Card>
  );

  const Field = ({ label, name, type = "text", required = false, options, placeholder }: {
    label: string; name: string; type?: string; required?: boolean; options?: string[]; placeholder?: string;
  }) => (
    <div className="grid gap-1">
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      {options ? (
        <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={form[name] ?? ""} onChange={set(name)}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <Input type={type} value={form[name] ?? ""} onChange={set(name)} required={required} placeholder={placeholder} />
      )}
    </div>
  );

  return (
    <div className="grid gap-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-1">
          <Link href="/employees" className="hover:underline">Employees</Link>
          <span>/</span>
          <span>New Employee</span>
        </div>
        <h1 className="text-2xl font-bold">Add New Employee</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>}

      <form onSubmit={submit} className="grid gap-6">
        <Section title="Personal Details">
          <Field label="Employee Code" name="employeeNumber" required placeholder="e.g. SGM-034" />
          <Field label="Full Name" name="fullName" required placeholder="e.g. John Smith" />
          <Field label="Title / Role" name="title" placeholder="e.g. Electrician Class 1" />
          <Field label="Department" name="department" />
          <Field label="Nationality" name="nationality" placeholder="e.g. Tanzania" />
          <Field label="Email" name="email" type="email" />
          <Field label="Phone" name="phone" type="tel" />
          <Field label="Start Date" name="startDate" type="date" required />
        </Section>

        <Section title="Pay Details">
          <Field label="Contract Type" name="contractType" options={["Citizen","Expert","Contract"]} />
          <Field label="Employment Type" name="employmentType" options={["FIXED","HOURLY","DAILY"]} />
          <Field label="Pay Currency" name="currency" options={["TZS","USD","BWP","ZAR"]} />
          <Field label="Base Salary (TZS/month, for FIXED)" name="baseSalary" type="number" placeholder="0" />
          <Field label="USD Salary/month (if paid in USD)" name="usdSalary" type="number" />
          <Field label="Hourly Rate (TZS, for HOURLY)" name="hourlyRate" type="number" />
          <Field label="Standard Hours / Month" name="stdHoursPerMonth" type="number" placeholder="234" />
          <Field label="Standby Daily Rate (TZS)" name="standbyDailyRate" type="number" />
        </Section>

        <Section title="Allowances (per month)">
          <Field label="Housing Allowance (TZS)" name="housingAllowance" type="number" />
          <Field label="Transport Allowance (TZS)" name="transportAllowance" type="number" />
          <Field label="Site Allowance (TZS)" name="siteAllowance" type="number" />
        </Section>

        <Section title="Bank & Statutory Details">
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
              placeholder="Internal notes..."
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Creating..." : "Create Employee"}
          </Button>
          <Link href="/employees">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
