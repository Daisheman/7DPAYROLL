"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState("");
  const slug = searchParams.get("company") || "";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          companySlug: form.get("companySlug"),
        }),
      });
      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Check your email</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            If an account exists for that email address, a reset link has been sent. Check your inbox and spam folder.
          </p>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push(slug ? `/login?company=${slug}` : "/login")}>
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold">Forgot Password</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Enter your company slug and email address to receive a reset link.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <Input name="companySlug" placeholder="company-slug" required defaultValue={slug} />
          <Input name="email" type="email" placeholder="your@email.com" required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button disabled={status === "loading"}>
            {status === "loading" ? "Sending..." : "Send Reset Link"}
          </Button>
          <a className="text-sm text-center text-[var(--primary)]"
            href={slug ? `/login?company=${slug}` : "/login"}>
            Back to Login
          </a>
        </form>
      </CardContent>
    </Card>
  );
}
