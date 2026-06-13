import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MfaVerificationPage() {
  return (
    <Card>
      <CardHeader>
        <ShieldCheck className="h-6 w-6 text-[var(--primary)]" />
        <h2 className="mt-3 text-2xl font-semibold">MFA verification</h2>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4">
          <Input inputMode="numeric" maxLength={6} placeholder="6-digit code" />
          <Button type="button">Verify</Button>
        </form>
      </CardContent>
    </Card>
  );
}
