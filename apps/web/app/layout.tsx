import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { tenantConfig } from "@/lib/tenant-config";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  themeColor: "#BE185D",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "7D Payroll" },
  title: `${tenantConfig.companyName} Payroll`,
  description: `${tenantConfig.productName} workspace for ${tenantConfig.companyName}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><link rel="manifest" href="/manifest.json" /><meta name="theme-color" content="#BE185D" /><meta name="apple-mobile-web-app-capable" content="yes" /></head><body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
