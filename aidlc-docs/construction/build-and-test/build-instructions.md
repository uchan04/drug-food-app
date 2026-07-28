# Build Instructions

## Prerequisites

- Node.js 20+ (`node --version`)
- pnpm 8+ (`pnpm --version`)
- Docker Desktop (for PostgreSQL)

## Initial Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start local PostgreSQL
docker compose up -d

# 3. Generate Prisma Client
pnpm --filter api prisma generate

# 4. Run database migrations
pnpm --filter api prisma migrate dev

# 5. Seed initial data
pnpm --filter api prisma db seed
```

## Build Commands

```bash
# Build all packages (shared-types → api → web)
pnpm build

# Build specific app
pnpm --filter api build
pnpm --filter web build
```

## Development

```bash
# Start all apps in dev mode (Turborepo parallel)
pnpm dev

# This starts:
# - API server: http://localhost:4000
# - Web app: http://localhost:3000
# - Swagger docs: http://localhost:4000/api/docs
```

## Docker Build (API)

```bash
# Build Docker image
docker build -f apps/api/Dockerfile -t drug-food-checker-api .

# Run container
docker run -p 4000:4000 --env-file .env.local drug-food-checker-api
```
