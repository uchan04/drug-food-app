# Logical Components - Unit 1: Foundation

## 컴포넌트 맵

```
+--------------------------------------------------+
|                  Unit 1: Foundation               |
+--------------------------------------------------+
|                                                  |
|  +--------------------------+                    |
|  | Turborepo Configuration |                    |
|  | - turbo.json             |                    |
|  | - workspace packages     |                    |
|  | - build pipeline         |                    |
|  +--------------------------+                    |
|                                                  |
|  +--------------------------+                    |
|  | Shared Types Package    |                    |
|  | - API request types      |                    |
|  | - API response types     |                    |
|  | - Enum definitions       |                    |
|  | - Common utility types   |                    |
|  +--------------------------+                    |
|                                                  |
|  +--------------------------+                    |
|  | Prisma Schema           |                    |
|  | - Entity definitions     |                    |
|  | - Relations              |                    |
|  | - Indexes (GIN, B-Tree)  |                    |
|  | - Enums                  |                    |
|  +--------------------------+                    |
|                                                  |
|  +--------------------------+                    |
|  | Database Migrations     |                    |
|  | - Initial schema         |                    |
|  | - pg_trgm extension      |                    |
|  | - Index creation         |                    |
|  +--------------------------+                    |
|                                                  |
|  +--------------------------+                    |
|  | Seed Data               |                    |
|  | - Drugs (6 categories)   |                    |
|  | - Foods (5 categories)   |                    |
|  | - Interactions (20+)     |                    |
|  | - Idempotent execution   |                    |
|  +--------------------------+                    |
|                                                  |
|  +--------------------------+                    |
|  | Shared Configurations   |                    |
|  | - TSConfig base          |                    |
|  | - ESLint config          |                    |
|  | - Prettier config        |                    |
|  | - .env.example           |                    |
|  +--------------------------+                    |
|                                                  |
+--------------------------------------------------+
```

---

## 파일 구조 (Unit 1 산출물)

```
drug-food-checker/
├── package.json              # Workspace root (pnpm)
├── pnpm-workspace.yaml       # Workspace 정의
├── turbo.json                # Turborepo 파이프라인
├── .env.example              # 환경 변수 템플릿
├── .gitignore
├── packages/
│   ├── shared-types/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── drug.types.ts
│   │       ├── food.types.ts
│   │       ├── interaction.types.ts
│   │       ├── auth.types.ts
│   │       ├── user.types.ts
│   │       ├── medicine-box.types.ts
│   │       ├── common.types.ts
│   │       └── health.types.ts
│   ├── tsconfig/
│   │   ├── package.json
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   └── nestjs.json
│   └── eslint-config/
│       ├── package.json
│       └── index.js
└── apps/
    └── api/
        └── prisma/
            ├── schema.prisma     # 전체 스키마
            ├── seed.ts           # 시드 데이터
            └── migrations/       # (prisma migrate 생성)
```

---

## 환경 변수 구조 (.env.example)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/drug_food_checker?schema=public&connection_limit=10&pool_timeout=5&connect_timeout=5&statement_timeout=10000"

# Auth (Unit 2에서 사용)
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# OAuth (Unit 2에서 사용)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
KAKAO_CLIENT_ID=""
KAKAO_CLIENT_SECRET=""

# Next.js (Unit 4에서 사용)
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

---

## Resiliency Compliance (Unit 1)

| Rule | Status | Evidence |
|------|--------|----------|
| RESILIENCY-01 | Compliant | Medium criticality documented |
| RESILIENCY-02 | Compliant | RTO/RPO Hours, Backup & Restore strategy |
| RESILIENCY-05 | Compliant | Structured logging types defined, metrics requirements documented |
| RESILIENCY-10 | Compliant | Connection timeout (5s), query timeout (10s) configured |
| RESILIENCY-12 | Compliant | Daily automated backup, 7-day retention, AES-256 encryption |
| RESILIENCY-03 | N/A | Change management applies at deployment (Unit 5) |
| RESILIENCY-04 | N/A | CI/CD applies at deployment (Unit 5) |
| RESILIENCY-06 | N/A | Health checks implemented in Unit 2 |
| RESILIENCY-07 | N/A | Resiliency monitoring in Unit 5 |
| RESILIENCY-08 | N/A | Multi-zone deployment in Unit 5 |
| RESILIENCY-09 | N/A | Auto-scaling in Unit 5 |
| RESILIENCY-11 | Compliant | Backup & Restore DR strategy selected |
| RESILIENCY-13 | N/A | Failover procedures in Unit 5 |
| RESILIENCY-14 | N/A | DR testing deferred to Operations |
| RESILIENCY-15 | N/A | Incident response in Unit 5 |

## PBT Compliance (Unit 1)

| Rule | Status | Evidence |
|------|--------|----------|
| PBT-01 | Compliant | Testable properties identified in domain-entities.md |
| PBT-09 | Compliant | fast-check selected, Vitest integration, documented in tech-stack-decisions.md |
| PBT-02~08, 10 | N/A | Applies at Code Generation stage |
