"use client";
import { useSearchParams } from "next/navigation";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { tenantConfig } from "@/lib/tenant-config";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          companySlug: formData.get("companySlug"),
          email: formData.get("email"),
          password: formData.get("password"),
          mfaCode: formData.get("mfaCode") || undefined,
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold">{tenantConfig.companyName} Payroll</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Secure sign-in for the {tenantConfig.productName} workspace.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} method="post" className="grid gap-4">
          <Input name="companySlug" placeholder="company-slug" required defaultValue={tenantConfig.companySlug} />
          <Input name="email" type="email" placeholder="admin@company.co.tz" required defaultValue={tenantConfig.defaultAdminEmail} />
          <Input name="password" type="password" placeholder="Password" required />
          <Input name="mfaCode" inputMode="numeric" maxLength={6} placeholder="MFA code, if enabled" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button>Sign in</Button>
          <a className="text-sm text-[var(--primary)]" href={`/forgot-password${typeof window !== "undefined" && new URLSearchParams(window.location.search).get("company") ? "?company=" + new URLSearchParams(window.location.search).get("company") : ""}`}>Forgot password?</a>
        </form>
      </CardContent>
    </Card>
  );
}
