# GitHub And Hosting Plan

## 1. Prepare GitHub

Install Git for Windows if `git --version` does not work.

```cmd
cd /d C:\Users\moyana\Desktop\payroll
git init
git add .
git commit -m "Initial Profacc payroll SaaS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/profacc-payroll.git
git push -u origin main
```

Do not commit `.env`. Use `.env.production.example` to create hosted environment variables.

## 2. Recommended Hosting Layout

Use three hosted services:

- Frontend: Vercel, Netlify, or Render static/Next hosting
- Backend: Render, Railway, Fly.io, or a VPS Node service
- Database: Neon, Supabase, Railway PostgreSQL, Render PostgreSQL, or a managed cloud PostgreSQL

Simple path:

- Vercel for `apps/web`
- Render Web Service for `apps/api`
- Neon PostgreSQL for the database

## 3. Backend Deployment

Backend root directory:

```text
apps/api
```

Build command from repository root:

```bash
npm install --no-audit --no-fund && npm --workspace packages/schemas run build && npm --workspace apps/api run prisma:generate && npm --workspace apps/api run build
```

Start command:

```bash
npm --workspace apps/api run start
```

Required backend environment variables:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_TTL
JWT_REFRESH_TTL
APP_ORIGIN
COOKIE_DOMAIN
API_PORT
STORAGE_ROOT
MFA_ISSUER
NODE_ENV
```

Run database migration after first deploy:

```bash
npm --workspace apps/api run prisma:migrate -- --name production_init
```

For production after migrations exist, use:

```bash
node ../../node_modules/prisma/build/index.js migrate deploy
```

## 4. Frontend Deployment

Frontend root directory:

```text
apps/web
```

Build command from repository root:

```bash
npm install --no-audit --no-fund && npm --workspace packages/schemas run build && npm --workspace apps/web run build
```

Start command:

```bash
npm --workspace apps/web run start
```

Required frontend variables:

```text
NEXT_PUBLIC_API_URL=https://your-frontend-domain.com/api
API_INTERNAL_URL=https://your-backend-domain.com/api
```

The frontend includes a Next.js route proxy at `/api/...`, so browser calls stay same-origin while the server forwards them to the Nest API.

## 5. Production Database

Create a PostgreSQL database and set:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

Then run:

```bash
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:migrate -- --name production_init
npm run db:seed
```

Only run `db:seed` in production when you intentionally want to create the 7D Minerals demo/initial company data.

## 6. Domains

Set:

```text
APP_ORIGIN=https://your-frontend-domain.com
COOKIE_DOMAIN=your-frontend-domain.com
NEXT_PUBLIC_API_URL=https://your-frontend-domain.com/api
API_INTERNAL_URL=https://your-backend-domain.com/api
```

If frontend and backend are on different subdomains, use:

```text
COOKIE_DOMAIN=.yourdomain.com
```

## 7. Before Going Live

- Rotate JWT secrets.
- Confirm PostgreSQL backups are enabled.
- Confirm HTTPS is active.
- Run migrations against production.
- Seed only once if required.
- Create a real OWNER account and change default seeded password.
- Confirm login, employee list, payroll run creation, and payslip download.
