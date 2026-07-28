# Services

## 서비스 아키텍처 개요

```
+------------------+     +------------------+     +------------------+
|   Next.js App    |---->|   NestJS API     |---->|   PostgreSQL     |
| (Frontend + BFF) |     |   (Backend)      |     |   (via Prisma)   |
+------------------+     +------------------+     +------------------+
        |                        |
        v                        v
+------------------+     +------------------+
| NextAuth.js      |     | OAuth Providers  |
| (Auth Session)   |     | (Google, Kakao)  |
+------------------+     +------------------+
```

---

## 서비스 정의

### 1. Frontend Service (Next.js App)

| 항목 | 내용 |
|------|------|
| **프레임워크** | Next.js 14+ (App Router) |
| **상태 관리** | TanStack Query (서버 상태) + Zustand (클라이언트 상태) |
| **UI** | shadcn/ui + Tailwind CSS |
| **인증** | NextAuth.js (세션 관리) |
| **국제화** | next-intl |
| **역할** | SSR/CSR 렌더링, 라우팅, 사용자 인터랙션, API 호출 |

### 2. Backend API Service (NestJS)

| 항목 | 내용 |
|------|------|
| **프레임워크** | NestJS |
| **ORM** | Prisma |
| **인증** | Passport.js + JWT |
| **유효성 검증** | class-validator + class-transformer |
| **문서** | Swagger (OpenAPI) |
| **역할** | 비즈니스 로직, 데이터 접근, API 제공, 인증/인가 |

### 3. Database Service (PostgreSQL)

| 항목 | 내용 |
|------|------|
| **엔진** | PostgreSQL 15+ |
| **접근** | Prisma ORM |
| **검색** | pg_trgm extension + full-text search |
| **백업** | 일일 자동 백업 (AWS RDS) |
| **역할** | 데이터 영속화, 검색 인덱싱, 트랜잭션 관리 |

---

## 서비스 오케스트레이션 패턴

### 검색 플로우
```
User Input → Next.js (debounce) → GET /api/drugs/search → DrugService.search() → Prisma → PostgreSQL (trigram)
```

### 약상자 추가 플로우
```
User Click → Next.js → POST /api/medicine-box/items → MedicineBoxService.addItem() → Prisma → PostgreSQL
```

### 상성 분석 플로우
```
User Request → Next.js → GET /api/interactions/analyze → InteractionService.analyzeUserBox()
  → MedicineBoxService.getUserBox() (약상자 조회)
  → DrugRepository.getIngredients() (성분 조회)
  → InteractionRepository.findByIngredients() (상호작용 매칭)
  → 결과 집계 및 정렬 (위험도별)
  → InteractionReport 반환
```

### 인증 플로우 (이메일)
```
Register: User → POST /api/auth/register → AuthService.register() → hash password → create user → issue JWT
Login: User → POST /api/auth/login → AuthService.login() → verify password → issue JWT + refresh token
```

### 인증 플로우 (OAuth)
```
1. User clicks "Google 로그인" → Redirect to Google OAuth
2. Google callback → GET /api/auth/oauth/google/callback
3. AuthService.handleOAuthCallback() → find or create user → issue JWT
4. Redirect to frontend with tokens
```

---

## 크로스커팅 관심사 (Cross-Cutting Concerns)

### 에러 처리
- NestJS Exception Filters (전역 에러 핸들링)
- 표준화된 에러 응답 포맷: `{ statusCode, message, error }`
- 프론트엔드: Error Boundary + Toast 알림

### 로깅
- Structured JSON logging (winston/pino)
- Request ID 추적 (correlation ID)
- 에러 로그 + 감사 로그

### 국제화 (i18n)
- 프론트엔드: next-intl (라우트 기반 locale)
- 백엔드: Accept-Language 헤더 기반 응답
- DB: 다국어 필드 (ko/en columns 또는 JSON)

### Health Check
- GET `/api/health` (shallow: 프로세스 상태)
- GET `/api/health/deep` (deep: DB 연결 확인)
