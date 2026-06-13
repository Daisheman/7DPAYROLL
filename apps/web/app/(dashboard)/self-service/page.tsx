import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SelfServicePage() {
  return <div className="grid gap-6"><h1 className="text-2xl font-bold">Employee Self-Service</h1><div className="grid gap-4 md:grid-cols-3">{["My payslips", "Leave balances", "Documents"].map((name) => <Card key={name}><CardContent><h2 className="font-semibold">{name}</h2><Button className="mt-4" variant="secondary">Open</Button></CardContent></Card>)}</div></div>;
}
