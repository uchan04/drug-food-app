# Component Dependencies

## 의존성 매트릭스

### Backend Module Dependencies

| Module | Drug | MedicineBox | Interaction | Auth | User |
|--------|------|-------------|-------------|------|------|
| **Drug** | - | - | - | - | - |
| **MedicineBox** | ✓ | - | - | ✓ | - |
| **Interaction** | ✓ | ✓ | - | ✓ | - |
| **Auth** | - | - | - | - | ✓ |
| **User** | - | - | - | - | - |

### 의존성 설명

- **MedicineBox → Drug**: 약상자 아이템은 Drug 엔티티를 참조
- **MedicineBox → Auth**: 인증된 사용자만 약상자 접근 가능
- **Interaction → Drug**: 약물 성분 데이터 조회 필요
- **Interaction → MedicineBox**: 사용자 약상자 데이터로 분석 수행
- **Interaction → Auth**: 인증된 사용자만 개인 분석 접근 가능
- **Auth → User**: 인증 시 사용자 데이터 생성/조회

---

## 통신 패턴

### Frontend → Backend

```
+------------------+          +------------------+
|   Next.js        |  HTTP    |   NestJS API     |
|   (Port 3000)    |--------->|   (Port 4000)    |
+------------------+  REST    +------------------+
        |
        | NextAuth.js manages
        | session cookies
        v
+------------------+
| Browser Session  |
+------------------+
```

- **프로토콜**: HTTPS (REST API)
- **인증**: Bearer Token (JWT) in Authorization header
- **직렬화**: JSON
- **에러 처리**: HTTP Status Codes + Error Response Body

### Backend → Database

```
+------------------+          +------------------+
|   NestJS         |  Prisma  |   PostgreSQL     |
|   (Services)     |--------->|   (Port 5432)    |
+------------------+  Client  +------------------+
```

- **접근**: Prisma Client (connection pool)
- **트랜잭션**: Prisma interactive transactions
- **마이그레이션**: Prisma Migrate

---

## 데이터 흐름도

### 주요 데이터 흐름

```
[사용자 브라우저]
       |
       | 1. 검색 요청 / 약상자 조작 / 분석 요청
       v
[Next.js Frontend]
       |
       | 2. API 호출 (TanStack Query)
       v
[NestJS API Gateway]
       |
       | 3-a. Guards: JWT 검증
       | 3-b. Pipes: 입력 유효성 검증
       v
[Service Layer]
       |
       | 4. 비즈니스 로직 실행
       v
[Prisma ORM]
       |
       | 5. SQL 쿼리 실행
       v
[PostgreSQL]
```

---

## 모노레포 패키지 구조

```
drug-food-checker/               (Turborepo root)
├── apps/
│   ├── web/                     (Next.js frontend)
│   └── api/                     (NestJS backend)
├── packages/
│   ├── shared-types/            (공유 TypeScript 타입)
│   ├── eslint-config/           (공유 ESLint 설정)
│   └── tsconfig/                (공유 TypeScript 설정)
├── turbo.json
├── package.json
└── .github/
    └── workflows/               (GitHub Actions CI/CD)
```

### 패키지 의존성

- `apps/web` → `packages/shared-types`
- `apps/api` → `packages/shared-types`
- `apps/web` ← (API 타입 공유) → `apps/api`

---

## 외부 의존성

| 서비스 | 용도 | 타입 |
|--------|------|------|
| Google OAuth | 소셜 로그인 | 외부 API |
| Kakao OAuth | 소셜 로그인 | 외부 API |
| AWS RDS | PostgreSQL 호스팅 | 인프라 |
| Vercel | Next.js 배포 | 인프라 |
| AWS ECS/Fargate | NestJS 배포 | 인프라 |
| GitHub Actions | CI/CD | 인프라 |
