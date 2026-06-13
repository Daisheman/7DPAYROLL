import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="font-bold">PayrollSaaS</Link>
        <ThemeToggle />
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[0.9fr_1fr]">
        <div className="hidden md:block">
          <h1 className="text-4xl font-bold">Secure payroll access for every company.</h1>
          <p className="mt-4 text-[var(--muted-foreground)]">Company slug routing, MFA-ready login, secure cookie sessions, and role-scoped dashboards.</p>
        </div>
        {children}
      </section>
    </main>
  );
}
