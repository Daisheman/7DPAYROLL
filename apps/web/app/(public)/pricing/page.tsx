import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <p className="mt-2 text-[var(--muted-foreground)]">Plans scale by company count, employee volume, and reporting needs.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {["Starter", "Growth", "Enterprise"].map((plan, index) => (
          <Card key={plan}>
            <CardHeader>
              <h2 className="text-xl font-semibold">{plan}</h2>
              <div className="mt-3 text-3xl font-bold">{index === 2 ? "Custom" : `TZS ${[150000, 450000][index].toLocaleString()}`}</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                <li>Multi-tenant company portal</li>
                <li>Payroll and statutory calculations</li>
                <li>PDF payslips and Excel exports</li>
                <li>Audit logs and role-based access</li>
              </ul>
              <Link href="/contact"><Button className="mt-6 w-full">Talk to sales</Button></Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
