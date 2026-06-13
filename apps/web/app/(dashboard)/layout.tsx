"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BarChart3, Building2, ClipboardList, FileSpreadsheet, FileText, Globe, History, Home, Settings, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { tenantConfig } from "@/lib/tenant-config";
import { api } from "@/lib/api";

// Nav items visible to all users
const BASE_NAV = [
  ["/dashboard",          "Dashboard",       Home],
  ["/employees",          "Employees",       Users],
  ["/payroll/runs",       "Payroll Runs",    ClipboardList],
  ["/payslips",           "Payslips",        FileText],
  ["/leave-management",   "Leave",           ClipboardList],
  ["/reports",            "Reports",         BarChart3],
  ["/statutory-returns",  "Statutory",       FileSpreadsheet],
  ["/company-settings",   "Settings",        Settings],
  ["/audit-logs",         "Audit Logs",      History],
  ["/user-management",    "Users",           Users],
  ["/self-service",       "Self-Service",    Building2],
  ["/period-end",         "Period End",      FileSpreadsheet],
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<any>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    // Load company info
    api<any>("/company").then(setCompany).catch(() => {});
    // Check if user is platform admin (OWNER/ADMIN in the platform company)
    api<any>("/auth/me").then(({ user }) => {
      const roles: string[] = user?.roles ?? [];
      const isPlatform = roles.includes("OWNER") || roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
      setIsPlatformAdmin(isPlatform);
      // Verify this is the platform company by checking slug
      api<any>("/company").then((c) => {
        // Show Manage Companies if user is OWNER/ADMIN in the platform company (7d-minerals-sa)
        // OR if they have SUPER_ADMIN role
        const platformSlugs = ["7d-minerals-sa", "7d-global-projects", "7d-holdings"];
        const isOwnerInPlatform = isPlatform && platformSlugs.some(s => c?.slug?.includes("7d"));
        setIsPlatformAdmin(isOwnerInPlatform || roles.includes("SUPER_ADMIN"));
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  const currency = company?.baseCurrency ?? tenantConfig.currency;

  return (
    <main className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-r bg-[var(--card)]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/7d-app-logo.jpg"
              alt="7D Global Projects Payroll"
              width={120}
              height={40}
              className="object-contain"
              style={{ maxHeight: 40 }}
            />
          </Link>
          <ThemeToggle />
        </div>
        <nav className="grid gap-1 p-3">
          {BASE_NAV.map(([href, label, Icon]) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors">
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
          {/* Only show Manage Companies to platform admin */}
          {isPlatformAdmin && (
            <Link href="/companies"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors">
              <Globe className="h-4 w-4 shrink-0" />
              Manage Companies
            </Link>
          )}
        </nav>
        <div className="border-t p-3 mt-2">
          <p className="text-xs text-[var(--muted-foreground)]">VAT {tenantConfig.vatNumber}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{tenantConfig.website}</p>
        </div>
      </aside>
      <section>
        <header className="flex items-center justify-between border-b bg-[var(--card)] px-4 py-4">
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">{company?.name ?? tenantConfig.companyName}</div>
            <div className="font-semibold">7D Global Projects — Payroll System</div>
          </div>
          <div className="rounded-md border px-3 py-2 text-sm">{currency} payroll</div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </section>
    </main>
  );
}
