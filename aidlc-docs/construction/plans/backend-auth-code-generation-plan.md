# Code Generation Plan - Unit 2: Backend Auth

## Unit Context
- **유닛명**: Backend Auth
- **유형**: Service Module (NestJS 앱 부트스트랩 + Auth + User)
- **의존**: Unit 1 (shared-types, Prisma schema)
- **산출물 위치**: `apps/api/src/`

## Stage Skip Rationale
- **Functional Design**: Skip — Auth 로직은 표준 패턴 (JWT + OAuth + bcrypt). Application Design에서 API spec 이미 정의됨.
- **NFR Requirements**: Skip — Unit 1에서 캡처 완료 (timeout, connection pool). Auth 보안은 표준.
- **NFR Design**: Skip — JWT Strategy, Refresh Token Rotation은 표준 패턴.
- **Infrastructure Design**: Skip — 새 인프라 없음 (Unit 1 DB, Unit 5 배포).

## Story Mapping
- FR-06: 사용자 인증 (이메일 + Google/Kakao OAuth)
- FR-02 (partial): 약상자 접근 제어 (AuthGuard)

---

## Generation Steps

### Step 1: NestJS Bootstrap
- [x] `apps/api/src/main.ts` (부트스트랩, 포트 4000, Swagger, CORS)
- [x] `apps/api/src/app.module.ts` (루트 모듈)

### Step 2: Prisma Service
- [x] `apps/api/src/prisma/prisma.module.ts`
- [x] `apps/api/src/prisma/prisma.service.ts`

### Step 3: Common (Guards, Filters, Pipes)
- [x] `apps/api/src/common/filters/http-exception.filter.ts`
- [x] `apps/api/src/common/guards/jwt-auth.guard.ts`
- [x] `apps/api/src/common/decorators/current-user.decorator.ts`

### Step 4: Auth Module
- [x] `apps/api/src/auth/auth.module.ts`
- [x] `apps/api/src/auth/auth.controller.ts`
- [x] `apps/api/src/auth/auth.service.ts`
- [x] `apps/api/src/auth/strategies/jwt.strategy.ts`
- [x] `apps/api/src/auth/dto/register.dto.ts`
- [x] `apps/api/src/auth/dto/login.dto.ts`

### Step 5: User Module
- [x] `apps/api/src/user/user.module.ts`
- [x] `apps/api/src/user/user.controller.ts`
- [x] `apps/api/src/user/user.service.ts`
- [x] `apps/api/src/user/dto/update-profile.dto.ts`

### Step 6: Health Module
- [x] `apps/api/src/health/health.controller.ts`

### Step 7: Documentation Summary
- [x] `aidlc-docs/construction/backend-auth/code/code-summary.md`

---

## Total: 7 Steps, ~17 files
