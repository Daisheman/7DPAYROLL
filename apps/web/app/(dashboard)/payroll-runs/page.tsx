"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PayrollRunsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/payroll/runs"); }, [router]);
  return <div className="p-8 text-[var(--muted-foreground)]">Redirecting...</div>;
}
