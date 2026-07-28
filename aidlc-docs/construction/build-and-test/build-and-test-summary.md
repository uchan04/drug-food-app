# Build & Test Summary

## Project Overview
- **Type**: Turborepo Monorepo
- **Apps**: `apps/api` (NestJS), `apps/web` (Next.js)
- **Packages**: `shared-types`, `tsconfig`, `eslint-config`
- **Database**: PostgreSQL 15 (Docker local, RDS production)

## Build Pipeline

```
pnpm install
  → prisma generate
    → pnpm build (turbo: shared-types → api → web)
```

## Test Pipeline

```
pnpm test (unit tests - vitest)
pnpm test:pbt (property-based tests - fast-check)
```

## CI/CD

- **Platform**: GitHub Actions
- **Trigger**: Push to main, Pull Requests
- **Jobs**:
  1. `lint-and-test` — Install, migrate, seed, lint, test, PBT
  2. `build` — Full build verification (depends on lint-and-test)
- **DB in CI**: PostgreSQL 15 service container

## Deployment Strategy

| Component | Platform | Strategy |
|-----------|----------|----------|
| Frontend (Next.js) | Vercel | Auto-deploy on push to main |
| Backend (NestJS) | AWS ECS Fargate | Docker image deploy (direct/in-place) |
| Database | AWS RDS PostgreSQL | Managed, migrations run pre-deploy |

## Resiliency Compliance

| Rule | Implementation |
|------|---------------|
| RESILIENCY-04 | GitHub Actions CI/CD, version-pinned rollback |
| RESILIENCY-05 | Structured logging (pino), API metrics |
| RESILIENCY-06 | GET /api/health (shallow), /api/health/deep (DB check) |
| RESILIENCY-10 | Connection timeout 5s, query timeout 10s |
| RESILIENCY-12 | RDS automated daily backup, 7-day retention |

## PBT Compliance (PBT-08, PBT-09)

| Requirement | Implementation |
|-------------|---------------|
| Framework | fast-check 3.x + Vitest |
| Shrinking | Enabled (default) |
| Seed logging | Vitest reporter outputs seed on failure |
| CI integration | Included in `lint-and-test` job |
| Domain generators | `test/generators/drug.generator.ts` |

## Quick Start

```bash
git clone <repo>
pnpm install
docker compose up -d
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
pnpm dev
# API: http://localhost:4000/api/docs
# Web: http://localhost:3000
```
