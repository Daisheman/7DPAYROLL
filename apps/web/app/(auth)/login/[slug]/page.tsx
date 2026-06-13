"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function CompanyLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [company, setCompany] = useState<any>(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      // Fetch company info for branding
      api<any>(`/auth/company-info?slug=${p.slug}`)
        .then(setCompany)
        .catch(() => setCompany({ name: p.slug, slug: p.slug }));
    });
  }, [params]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const csrf = await api<{ csrfToken: string }>("/auth/csrf");
      await api("/auth/login", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({ companySlug: slug, email: form.email, password: form.password }),
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/7d-logo.png" alt="Logo" width={140} height={50} className="object-contain" />
        </div>

        {/* Company name */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {company?.name ?? slug}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Payroll Portal</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={login} className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email" required autoFocus
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password" required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Enter your password"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
          Powered by Profacc Payroll
        </p>
      </div>
    </div>
  );
}
