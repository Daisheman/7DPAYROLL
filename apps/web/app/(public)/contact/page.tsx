import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-[0.8fr_1fr]">
      <div>
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-3 text-[var(--muted-foreground)]">Plan a SaaS rollout, migrate payroll data, or configure statutory reporting.</p>
      </div>
      <Card>
        <CardContent>
          <form className="grid gap-4">
            <Input placeholder="Work email" type="email" />
            <Input placeholder="Company name" />
            <Input placeholder="Employee count" />
            <textarea className="min-h-32 rounded-md border bg-[var(--card)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]" placeholder="What do you need?" />
            <Button type="button">Send request</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
