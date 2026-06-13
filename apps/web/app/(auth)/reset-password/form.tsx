"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const company = searchParams.get("company") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const newPassword = form.get("newPassword") as string;
    const confirm = form.get("confirm") as string;
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setStatus("loading");
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired reset link.");
      setStatus("idle");
    }
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Invalid Link</h2>
          <p className="text-sm text-[var(--muted-foreground)]">This reset link is invalid or has expired.</p>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/forgot-password")}>Request New Link</Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "done") {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Password Reset</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Your password has been reset successfully.</p>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push(company ? `/login?company=${company}` : "/login")}>
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold">Set New Password</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Enter your new password below.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <Input name="newPassword" type="password" placeholder="New password (min 8 chars)" required minLength={8} />
          <Input name="confirm" type="password" placeholder="Confirm new password" required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button disabled={status === "loading"}>
            {status === "loading" ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
