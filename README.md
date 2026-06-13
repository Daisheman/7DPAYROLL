# Profacc Payroll System — 7D Minerals (SA)

Built by **Profacc Business Services** | Francistown, Botswana | +267 72118946

---

## Quick Start (Local)

### Prerequisites
- Node.js 22 LTS
- Docker Desktop (for local Postgres)

### 1. Install & Setup
```powershell
# Clone and install
npm install --include=dev --workspaces --no-audit --no-fund

# Copy environment file
copy .env.example .env
# Edit .env and set your DATABASE_URL
```

### 2. Start Everything
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

This will:
- Start PostgreSQL in Docker
- Run all migrations
- Seed 7D Minerals data (33 employees)
- Start API on http://localhost:4000
- Start Web on http://localhost:3000

### 3. Login
| Field | Value |
|---|---|
| Company slug | `7d-minerals-sa` |
| Email | `admin@profacc.co.bw` |
| Password | `Profacc2025#` |

---

## After Any Schema Change

```powershell
npx prisma migrate dev --schema apps/api/prisma/schema.prisma --name your_change_name
```

This regenerates the Prisma client and applies the migration.

---

## Deployment (Vercel + Render)

See `deploy/VERCEL_RENDER_STEPS.md`

**Vercel env vars:**
```
NEXT_PUBLIC_API_URL=/api
API_INTERNAL_URL=https://profacc-api.onrender.com/api
```

**Render env vars:**
```
DATABASE_URL=<your Neon URL>
APP_ORIGIN=https://your-vercel-url.vercel.app
COOKIE_DOMAIN=your-vercel-url.vercel.app
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
```

---

## What's In This Release

### Payroll Engine (packages/schemas/src/payroll-engine.ts)
- ✅ Multi-country: Tanzania (TZ) and Botswana (BW) compliance
- ✅ OT 1.5× and OT 2.0× pay
- ✅ Public holiday 2.0× pay
- ✅ Standby pay (daily rate × days)
- ✅ Callout 1.5× and 2.0× pay
- ✅ Bonus / gratuity
- ✅ Deductions toggle — when OFF, net = gross (per payroll run)
- ✅ Pro-rata calculation for start month
- ✅ USD employees with exchange rate conversion
- ✅ YTD tracking (only from APPROVED/LOCKED runs)

### Tanzania (TZ) Statutory
- PAYE bands: 0% / 9% / 20% / 25% / 30%
- NSSF: 10% EE + 10% ER, capped at TZS 720,000/month
- SDL: 4.5% of gross
- WCF: 1.0% of gross

### Botswana (BW) Statutory
- PAYE bands: 0% / 5% / 12.5% / 18.75% / 25%
- BPOPF: 5% EE + 10% ER, no cap
- Training Levy: 0.5% of gross

### Payslip PDF
- Company header with branding
- Full earnings breakdown (all pay types)
- Statutory deductions
- NET PAY (prominent)
- YTD section (locked runs only)
- Employer costs section
- Deduction suspension warning banner
- Signature lines
- Profacc footer

### Reports
- Payroll summary Excel (all employees)
- NSSF/BPOPF schedule Excel
- P9A / ITW Annual Return Excel

### Payroll Run UI
- Inline editable table: OT, OT 2.0×, PH, Standby, Callout, Bonus, Deductions, Adjustments
- Real-time recalculation as you type
- Deductions toggle with warning
- Per-employee payslip download
- Excel and NSSF export buttons

---

## Adding a New Country

Edit `packages/schemas/src/payroll-engine.ts` and add to `COUNTRY_CONFIGS`:

```typescript
MY_COUNTRY: {
  country: "XX" as CountryCode,
  currency: "XXX" as CurrencyCode,
  payeBands: [...],
  pensionEERate: 0.05,
  pensionERRate: 0.10,
  pensionCap: null,
  sdlRate: 0,
  wcfRate: 0,
  annualLeaveDays: 15,
  sickLeaveDays: 30,
  pensionLabel: "Pension Fund",
  taxIdLabel: "Tax ID",
  filingDeadlines: { paye: "15th of following month" },
}
```

No other code changes needed — the engine, payslip, and reports adapt automatically.

---

## Security Notes (Production)

1. **Rotate Neon password** — the original was shared in chat
2. **Change admin password** after first login
3. **Enable MFA** in Company Settings
4. JWT secrets in Render env vars must be strong random strings (32+ chars)
