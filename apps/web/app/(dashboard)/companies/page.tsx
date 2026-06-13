"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const COUNTRIES = [
  { code: "ZA", name: "South Africa",  currency: "ZAR", flag: "🇿🇦", regulations: ["SARS PAYE (2025/26)", "UIF 1% + 1%", "SDL 1%", "21 days annual leave (BCEA)"] },
  { code: "BW", name: "Botswana",      currency: "BWP", flag: "🇧🇼", regulations: ["BURS PAYE (2025/26)", "BPOPF 5% + 10%", "Levy 1%", "15 days annual leave"] },
  { code: "TZ", name: "Tanzania",      currency: "TZS", flag: "🇹🇿", regulations: ["TRA PAYE (2025/26)", "NSSF 5% + 10%", "SDL 4.5%", "WCF 1%", "28 days annual leave"] },
  { code: "ZW", name: "Zimbabwe",      currency: "USD", flag: "🇿🇼", regulations: ["ZIMRA PAYE", "NSSA contributions", "30 days annual leave"] },
  { code: "KE", name: "Kenya",         currency: "KES", flag: "🇰🇪", regulations: ["KRA PAYE", "NHIF + NSSF", "21 days annual leave"] },
  { code: "ZM", name: "Zambia",        currency: "ZMW", flag: "🇿🇲", regulations: ["ZRA PAYE", "NAPSA 5% + 5%", "24 days annual leave"] },
  { code: "MW", name: "Malawi",        currency: "MWK", flag: "🇲🇼", regulations: ["MRA PAYE", "MASM pension", "30 days annual leave"] },
  { code: "MZ", name: "Mozambique",    currency: "MZN", flag: "🇲🇿", regulations: ["AT PAYE", "INSS contributions", "30 days annual leave"] },
  { code: "NA", name: "Namibia",       currency: "NAD", flag: "🇳🇦", regulations: ["NamRA PAYE", "Social Security", "24 days annual leave"] },
  { code: "NG", name: "Nigeria",       currency: "NGN", flag: "🇳🇬", regulations: ["FIRS PAYE (PITA)", "NHF + NSITF", "21 days annual leave"] },
  { code: "GH", name: "Ghana",         currency: "GHS", flag: "🇬🇭", regulations: ["GRA PAYE", "SSNIT 5.5% + 13%", "15 days annual leave"] },
  { code: "UG", name: "Uganda",        currency: "UGX", flag: "🇺🇬", regulations: ["URA PAYE", "NSSF 5% + 10%", "21 days annual leave"] },
  { code: "OTHER", name: "Other",      currency: "USD", flag: "🌍", regulations: ["Standard international rules apply"] },
];

const ROLES = ["OWNER","ADMIN","PAYROLL_MANAGER","PAYROLL_PROCESSOR","HR_MANAGER","ACCOUNTANT","VIEWER"];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newCompany, setNewCompany] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Edit state
  const [editCompany, setEditCompany] = useState<any>(null);
  // Add user to company state
  const [addUserFor, setAddUserFor] = useState<any>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "ADMIN", tempPassword: "" });

  const [form, setForm] = useState({
    name: "", country: "ZA", baseCurrency: "ZAR",
    address: "", email: "", taxNumber: "", registration: "",
    adminName: "", adminEmail: "", adminPassword: "",
  });

  useEffect(() => {
    load();
  }, []);

  function load() {
    api<any[]>("/company/all").then(setCompanies).catch(() => {
      setError("Access denied. Owner or Admin role required.");
    });
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = COUNTRIES.find((c) => c.code === e.target.value);
    setForm((f) => ({ ...f, country: e.target.value, baseCurrency: country?.currency ?? "USD" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const result = await api<any>("/company/create", { method: "POST", body: JSON.stringify(form) });
      setNewCompany(result);
      load();
      setShowForm(false);
      setForm({ name: "", country: "ZA", baseCurrency: "ZAR", address: "", email: "", taxNumber: "", registration: "", adminName: "", adminEmail: "", adminPassword: "" });
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create company"); }
    finally { setSaving(false); }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    if (!addUserFor) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      // Use the platform admin endpoint to create user in target company
      await api("/company/add-user", {
        method: "POST",
        body: JSON.stringify({ companyId: addUserFor.id, ...userForm }),
      });
      setSuccess(`User ${userForm.email} added to ${addUserFor.name}.`);
      setAddUserFor(null);
      setUserForm({ name: "", email: "", role: "ADMIN", tempPassword: "" });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add user"); }
    finally { setSaving(false); }
  }

  async function deleteCompany(company: any) {
    if (!confirm(`Delete "${company.name}"? This cannot be undone. All employees and payroll data will be lost.`)) return;
    try {
      await api(`/company/delete/${company.id}`, { method: "DELETE" });
      setSuccess(`${company.name} deleted.`);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete company"); }
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === form.country);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost";

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Companies</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Each company has its own isolated workspace, users and payroll data.</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setNewCompany(null); setEditCompany(null); setAddUserFor(null); }}>
          {showForm ? "Cancel" : "+ New Company"}
        </Button>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 flex justify-between"><span>{error}</span><button onClick={() => setError("")} className="font-bold ml-2">×</button></div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex justify-between"><span>{success}</span><button onClick={() => setSuccess("")} className="font-bold ml-2">×</button></div>}

      {/* New credentials after creation */}
      {newCompany?.adminCredentials && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <h2 className="font-semibold text-green-800">✓ Company Created — Share These Credentials</h2>
            <p className="text-xs text-green-700">Save these now. The password will not be shown again.</p>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {[
              ["Company", newCompany.name],
              ["Login URL", `${baseUrl}/login?company=${newCompany.adminCredentials.companySlug}`],
              ["Admin Email", newCompany.adminCredentials.email],
              ["Temp Password", newCompany.adminCredentials.tempPassword],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center py-1 border-b border-green-200 last:border-0">
                <span className="text-green-700 font-medium">{l}</span>
                <span className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-green-200 select-all">{v}</span>
              </div>
            ))}
            <Button variant="secondary" className="w-fit mt-2" onClick={() => setNewCompany(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      {/* Add User to Company */}
      {addUserFor && (
        <Card className="border-blue-200">
          <CardHeader>
            <h2 className="font-semibold">Add User to {addUserFor.name}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">Creates a user in that company. Share credentials manually.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={addUser} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Full Name *</label>
                <Input required value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" required value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Role</label>
                <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Temp Password</label>
                <Input value={userForm.tempPassword} onChange={(e) => setUserForm((f) => ({ ...f, tempPassword: e.target.value }))}
                  placeholder="Leave blank for Welcome2025#" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add User"}</Button>
                <Button type="button" variant="secondary" onClick={() => setAddUserFor(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Create form */}
      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Register New Company</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1 md:col-span-2">
                  <label className="text-sm font-medium">Company Name *</label>
                  <Input required value={form.name} onChange={set("name")} placeholder="e.g. Acme Mining Ltd" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Country *</label>
                  <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={form.country} onChange={onCountryChange}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Base Currency</label>
                  <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={form.baseCurrency}
                    onChange={(e) => setForm((f) => ({ ...f, baseCurrency: e.target.value }))}>
                    {["ZAR","BWP","TZS","USD","KES","ZMW","MWK","MZN","NAD","NGN","GHS","UGX","EUR","GBP"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Tax / VAT Number</label>
                  <Input value={form.taxNumber} onChange={set("taxNumber")} placeholder="Tax registration number" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Contact Email</label>
                  <Input type="email" value={form.email} onChange={set("email")} placeholder="contact@company.com" />
                </div>
              </div>
              {selectedCountry && (
                <div className="rounded-lg bg-[var(--muted)] p-3">
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">{selectedCountry.flag} {selectedCountry.name} — Applied automatically</p>
                  {selectedCountry.regulations.map((r) => (
                    <div key={r} className="flex items-center gap-2 text-xs"><span className="text-green-600 font-bold">✓</span><span>{r}</span></div>
                  ))}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">Company Admin User</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Admin Name *</label>
                    <Input required value={form.adminName} onChange={set("adminName")} placeholder="e.g. John Smith" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Admin Email *</label>
                    <Input type="email" required value={form.adminEmail} onChange={set("adminEmail")} placeholder="admin@company.com" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Temp Password</label>
                    <Input value={form.adminPassword} onChange={set("adminPassword")} placeholder="Blank = Welcome2025#" />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-fit">{saving ? "Creating..." : "Create Company & Admin"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Companies list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => {
          const countryInfo = COUNTRIES.find((c) => c.code === company.country);
          const loginUrl = `${baseUrl}/login?company=${company.slug}`;
          return (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold">{company.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{company.slug}</p>
                  </div>
                  <span className="text-2xl">{countryInfo?.flag ?? "🌍"}</span>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Country</span><span className="font-medium">{countryInfo?.name ?? company.country}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Currency</span><span className="font-medium">{company.baseCurrency ?? "TZS"}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Employees</span><span className="font-medium">{company._count?.employees ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Payroll Runs</span><span className="font-medium">{company._count?.payrollRuns ?? 0}</span></div>
                <div className="border-t pt-2 mt-1">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">Login Link</p>
                  <p className="text-xs font-mono bg-[var(--muted)] rounded px-2 py-1 break-all select-all cursor-pointer"
                    onClick={() => navigator.clipboard?.writeText(loginUrl)}
                    title="Click to copy">
                    {loginUrl}
                  </p>
                </div>
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button size="sm" variant="secondary"
                    onClick={() => { setAddUserFor(company); setShowForm(false); setEditCompany(null); }}>
                    + Add User
                  </Button>
                  <Button size="sm" variant="secondary"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => deleteCompany(company)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
