# Vercel + Render Deployment Steps

## 1. Backend On Render

1. Go to Render.
2. New > Web Service.
3. Connect GitHub repo `Daisheman/profacc-payroll`.
4. Use these settings:

```text
Root Directory: .
Build Command: npm install --no-audit --no-fund && npm --workspace packages/schemas run build && npm --workspace apps/api run prisma:generate && npm --workspace apps/api run build
Start Command: npm --workspace apps/api run start
Health Check Path: /api/docs
```

5. Add PostgreSQL on Render or use Neon/Supabase.
6. Add environment variables:

```text
NODE_ENV=production
API_PORT=4000
DATABASE_URL=your_postgres_connection_string
JWT_ACCESS_SECRET=long_random_secret
JWT_REFRESH_SECRET=different_long_random_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
APP_ORIGIN=https://your-vercel-app.vercel.app
COOKIE_DOMAIN=your-vercel-app.vercel.app
STORAGE_ROOT=/tmp/payroll-storage
MFA_ISSUER=Profacc
```

7. Deploy backend.
8. After backend deploys, run migrations from Render shell:

```bash
npm --workspace apps/api run prisma:migrate -- --name production_init
```

For later deploys, use `migrate deploy` once migration files are committed.

## 2. Frontend On Vercel

1. Go to Vercel.
2. Add New Project.
3. Import `Daisheman/profacc-payroll`.
4. Set Root Directory:

```text
apps/web
```

5. Add environment variables:

```text
NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app/api
API_INTERNAL_URL=https://your-render-api.onrender.com/api
```

6. Deploy.

The frontend has a Next.js proxy at `/api/...`; browser calls go to Vercel first, then Vercel forwards to Render.

## 3. Update Backend After Vercel URL Exists

After Vercel gives you the final frontend URL, update Render:

```text
APP_ORIGIN=https://your-vercel-app.vercel.app
COOKIE_DOMAIN=your-vercel-app.vercel.app
```

Redeploy backend.

## 4. First Production Login

If seeded:

```text
Company slug: 7d-minerals-sa
Email: admin@profacc.co.bw
Password: Profacc2025#
```

Change the password after first login before using real payroll data.
