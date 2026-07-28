# Code Generation Plan - Unit 1: Foundation

## Unit Context
- **유닛명**: Foundation
- **유형**: Infrastructure (모노레포 구조, 공유 타입, DB 스키마, 시드 데이터)
- **의존**: 없음 (최초 유닛)
- **산출물 위치**: Workspace root (`/Users/hwang-yuchan/무제 폴더/`)
- **프로젝트 구조**: Turborepo 모노레포

## Story Mapping
- FR-01 (약물 검색): 데이터 모델 + 타입 정의
- FR-02 (내 약상자): 데이터 모델 + 타입 정의
- FR-03 (상성 분석): 데이터 모델 + 타입 정의
- FR-06 (인증): 데이터 모델 + 타입 정의
- FR-07 (다국어): 다국어 컬럼 구조

---

## Generation Steps

### Step 1: Monorepo Root Setup
- [x] `package.json` (workspace root, pnpm scripts)
- [x] `pnpm-workspace.yaml`
- [x] `turbo.json` (빌드 파이프라인 정의)
- [x] `.gitignore`
- [x] `.nvmrc` (Node 20)
- [x] `.env.example`

### Step 2: Shared TypeScript Config Package
- [x] `packages/tsconfig/package.json`
- [x] `packages/tsconfig/base.json`
- [x] `packages/tsconfig/nestjs.json`
- [x] `packages/tsconfig/nextjs.json`

### Step 3: Shared ESLint Config Package
- [x] `packages/eslint-config/package.json`
- [x] `packages/eslint-config/index.js`

### Step 4: Shared Types Package
- [x] `packages/shared-types/package.json`
- [x] `packages/shared-types/tsconfig.json`
- [x] `packages/shared-types/src/index.ts`
- [x] `packages/shared-types/src/common.types.ts`
- [x] `packages/shared-types/src/drug.types.ts`
- [x] `packages/shared-types/src/food.types.ts`
- [x] `packages/shared-types/src/interaction.types.ts`
- [x] `packages/shared-types/src/auth.types.ts`
- [x] `packages/shared-types/src/user.types.ts`
- [x] `packages/shared-types/src/medicine-box.types.ts`
- [x] `packages/shared-types/src/health.types.ts`

### Step 5: Prisma Schema
- [x] `apps/api/prisma/schema.prisma` (전체 엔티티, 관계, 인덱스)

### Step 6: Seed Data
- [x] `apps/api/prisma/seed.ts` (약물 6카테고리, 음식, 상호작용 데이터)

### Step 7: Docker Compose (Local Dev)
- [x] `docker-compose.yml` (PostgreSQL 15)

### Step 8: API App Scaffold (Minimal)
- [x] `apps/api/package.json` (의존성: prisma, @prisma/client, fast-check, vitest)
- [x] `apps/api/tsconfig.json`

### Step 9: Web App Scaffold (Minimal)
- [x] `apps/web/package.json` (의존성: next, react, shared-types)
- [x] `apps/web/tsconfig.json`

### Step 10: Documentation Summary
- [x] `aidlc-docs/construction/foundation/code/code-summary.md`

---

## Total: 10 Steps, ~30 files
## Estimated Scope: Monorepo skeleton + full data model + seed data
