import Link from "next/link";
import { BarChart3, Building2, FileText, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { tenantConfig } from "@/lib/tenant-config";

export default function LandingPage() {
  const features: Array<[string, string, LucideIcon]> = [
    ["Multi-company", "Tenant-isolated payroll, HR, users, audit logs and settings per company.", Building2],
    ["Payroll engine", "Tanzania PAYE, NSSF, SDL, WCF, bonuses, overtime, standby and leave deductions.", BarChart3],
    ["Reports & exports", "Payslip PDFs, Excel summaries, statutory returns, bank payment files and P9A.", FileText],
    ["Secure by design", "JWT rotation, secure cookies, RBAC, MFA, CSP headers and full audit trail.", ShieldCheck],
  ];

  return (
    <>
      <section className="bg-[var(--card)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
              {tenantConfig.createdBy} Payroll System
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              {tenantConfig.companyName}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[var(--muted-foreground)]">
              A browser-accessible payroll, HR and statutory reporting workspace.
              Manage employees, run payroll, generate payslips and file statutory returns — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login"><Button>Open portal</Button></Link>
              <Link href="/pricing"><Button variant="secondary">View pricing</Button></Link>
            </div>
          </div>

          {/* Feature highlights - no live financial data */}
          <div className="grid gap-3 rounded-lg border bg-[var(--background)] p-4 content-start">
            {[
              { label: "Employees", icon: "👥", desc: "Manage your workforce" },
              { label: "Payroll Runs", icon: "💰", desc: "Calculate and approve payroll" },
              { label: "Statutory Returns", icon: "📋", desc: "PAYE, NSSF, SDL & WCF" },
              { label: "Payslips & Reports", icon: "📄", desc: "PDF payslips & Excel exports" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-md bg-[var(--card)] p-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-12 md:grid-cols-4">
        {features.map(([title, text, Icon]) => (
          <Card key={title as string}>
            <CardContent>
              <Icon className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{text}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
