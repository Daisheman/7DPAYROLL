# Production Deployment Guide

## Required Services

- PostgreSQL 16+
- Object storage or persistent volume for payslip PDFs, employee documents, backups, and audit exports
- HTTPS load balancer or Nginx with managed certificates
- Secret manager for JWT and database credentials

## Environment

Use `.env.example` as the baseline. In production:

- Set `NODE_ENV=production`.
- Use strong unique `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Set `COOKIE_DOMAIN` to your SaaS domain.
- Set `APP_ORIGIN=https://your-domain`.
- Set `DATABASE_URL` to the managed PostgreSQL connection string.
- Mount `STORAGE_ROOT` to durable storage or replace `StorageService` with S3-compatible storage.

## Database

Run migrations during release:

```bash
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Use PostgreSQL automated backups, PITR where available, and encrypted snapshots. Tenant isolation is implemented by `companyId` scoping and indexed composite constraints; database row-level security can be added later for an extra boundary.

## CI/CD Recommendation

1. Install dependencies with `npm ci`.
2. Run `npm --workspace packages/schemas run build`.
3. Run `npm --workspace apps/api run prisma:generate`.
4. Run API tests and TypeScript checks.
5. Run `npm --workspace apps/web run build`.
6. Build and scan Docker images.
7. Deploy migrations.
8. Deploy API and web containers.

## HTTPS

Terminate TLS at your cloud load balancer or extend `deploy/nginx/default.conf` with a `listen 443 ssl;` server block and mounted certificates. Keep secure cookies enabled in production.

## Scaling

- API is stateless and can run multiple replicas.
- Web is stateless and can run multiple replicas.
- PostgreSQL should be managed, backed up, and monitored.
- File storage should use object storage for multi-replica production deployments.
