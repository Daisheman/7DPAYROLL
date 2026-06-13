import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <header className="border-b bg-[var(--card)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold">PayrollSaaS</Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/pricing">Pricing</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login"><Button size="sm">Login</Button></Link>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
