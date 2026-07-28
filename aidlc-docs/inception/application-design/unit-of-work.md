# Unit of Work Definitions

## 분해 전략
- **접근**: Backend-first (API 완성 → 프론트엔드 연동)
- **유닛 크기**: 중간 (도메인 모듈 단위)
- **근거**: Turborepo 모노레포에서 shared-types를 통한 타입 공유 이점 극대화. 백엔드 API가 확정되면 프론트엔드 개발이 명확한 계약 위에서 진행됨.

---

## Unit 1: Project Foundation & Shared Types

### 개요
| 항목 | 내용 |
|------|------|
| **유닛명** | foundation |
| **유형** | Infrastructure |
| **범위** | 모노레포 구조, 공유 타입, 설정, DB 스키마 |

### 책임
- Turborepo 모노레포 초기 구조 설정
- `packages/shared-types` — API 요청/응답 타입 정의
- `packages/tsconfig` — 공유 TypeScript 설정
- `packages/eslint-config` — 공유 린트 설정
- Prisma 스키마 정의 및 마이그레이션
- 시드 데이터 (약물, 음식, 상호작용 초기 데이터)
- 환경 변수 구조 정의

### 산출물
- `turbo.json`, root `package.json`
- `packages/shared-types/` (모든 API 타입)
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- 환경 변수 템플릿 (`.env.example`)

---

## Unit 2: Backend Core (Auth + User)

### 개요
| 항목 | 내용 |
|------|------|
| **유닛명** | backend-auth |
| **유형** | Service Module |
| **범위** | NestJS 앱 초기화, 인증, 사용자 관리 |

### 책임
- NestJS 앱 부트스트랩 (`apps/api`)
- Auth Module (이메일 로그인, OAuth, JWT)
- User Module (프로필 CRUD)
- Prisma Service (DB 연결)
- Common (Guards, Filters, Pipes, Interceptors)
- Health Check 엔드포인트

### 산출물
- `apps/api/src/main.ts` (부트스트랩)
- `apps/api/src/auth/` (전체 인증 모듈)
- `apps/api/src/user/` (사용자 모듈)
- `apps/api/src/prisma/` (Prisma 서비스)
- `apps/api/src/common/` (공통 유틸리티)
- `apps/api/src/health/` (헬스체크)

---

## Unit 3: Backend Domain (Drug + Interaction + MedicineBox)

### 개요
| 항목 | 내용 |
|------|------|
| **유닛명** | backend-domain |
| **유형** | Service Module |
| **범위** | 핵심 비즈니스 로직 — 약물 검색, 약상자, 상성 분석 |

### 책임
- Drug Module (검색, 자동완성, 상세 조회)
- Medicine Box Module (약상자 CRUD)
- Interaction Module (상성 분석 엔진)
- 검색 인덱스 설정 (pg_trgm, full-text)

### 산출물
- `apps/api/src/drug/` (약물 모듈)
- `apps/api/src/medicine-box/` (약상자 모듈)
- `apps/api/src/interaction/` (상성 분석 모듈)
- API 통합 테스트

---

## Unit 4: Frontend Application

### 개요
| 항목 | 내용 |
|------|------|
| **유닛명** | frontend |
| **유형** | Application |
| **범위** | Next.js 웹 앱 전체 (UI + API 연동) |

### 책임
- Next.js App Router 구조 설정
- NextAuth.js 인증 연동
- 검색 UI (자동완성 포함)
- 약상자 관리 UI
- 상성 분석 결과 UI (위험도별 시각화)
- shadcn/ui 컴포넌트 구성
- TanStack Query + Zustand 상태 관리
- next-intl 국제화 (한/영)
- 반응형 레이아웃

### 산출물
- `apps/web/` (전체 Next.js 앱)
- `apps/web/app/` (라우트, 페이지)
- `apps/web/components/` (UI 컴포넌트)
- `apps/web/lib/` (API 클라이언트, 유틸리티)
- `apps/web/messages/` (i18n 번역 파일)

---

## Unit 5: CI/CD & Infrastructure

### 개요
| 항목 | 내용 |
|------|------|
| **유닛명** | infra |
| **유형** | Infrastructure |
| **범위** | GitHub Actions, 배포 설정, 인프라 코드 |

### 책임
- GitHub Actions 워크플로우 (빌드, 테스트, 배포)
- Vercel 배포 설정 (프론트엔드)
- AWS 배포 설정 (백엔드 - ECS/Fargate)
- AWS RDS 설정 (PostgreSQL)
- 환경 변수 관리
- Docker 설정 (백엔드)

### 산출물
- `.github/workflows/` (CI/CD 파이프라인)
- `apps/api/Dockerfile`
- `apps/api/docker-compose.yml` (로컬 개발용)
- 인프라 설정 문서/코드

---

## 구현 순서

```
Unit 1 (Foundation) → Unit 2 (Backend Auth) → Unit 3 (Backend Domain) → Unit 4 (Frontend) → Unit 5 (Infra)
```

| 순서 | 유닛 | 의존 대상 | 근거 |
|------|------|-----------|------|
| 1 | Foundation | 없음 | 모든 유닛의 기반 (타입, 스키마) |
| 2 | Backend Auth | Unit 1 | API 서버 부트스트랩 + 인증 기반 |
| 3 | Backend Domain | Unit 1, 2 | 인증 위에 비즈니스 로직 구축 |
| 4 | Frontend | Unit 1, 2, 3 | 완성된 API 기반으로 UI 구현 |
| 5 | Infra | Unit 1~4 | 모든 앱 완성 후 배포 파이프라인 |

---

## 코드 조직 전략 (Greenfield)

```
drug-food-checker/                    # Turborepo root
├── apps/
│   ├── web/                          # Unit 4: Frontend
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Home (검색)
│   │   │   │   ├── medicine-box/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── analysis/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── register/page.tsx
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx
│   │   │   └── api/auth/[...nextauth]/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui
│   │   │   ├── search/
│   │   │   ├── medicine-box/
│   │   │   ├── analysis/
│   │   │   └── auth/
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── messages/
│   │       ├── ko.json
│   │       └── en.json
│   └── api/                          # Unit 2 + 3: Backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── strategies/
│       │   │   └── guards/
│       │   ├── user/
│       │   │   ├── user.module.ts
│       │   │   ├── user.controller.ts
│       │   │   └── user.service.ts
│       │   ├── drug/
│       │   │   ├── drug.module.ts
│       │   │   ├── drug.controller.ts
│       │   │   └── drug.service.ts
│       │   ├── medicine-box/
│       │   │   ├── medicine-box.module.ts
│       │   │   ├── medicine-box.controller.ts
│       │   │   └── medicine-box.service.ts
│       │   ├── interaction/
│       │   │   ├── interaction.module.ts
│       │   │   ├── interaction.controller.ts
│       │   │   └── interaction.service.ts
│       │   ├── prisma/
│       │   │   └── prisma.service.ts
│       │   ├── health/
│       │   │   └── health.controller.ts
│       │   └── common/
│       │       ├── filters/
│       │       ├── guards/
│       │       ├── pipes/
│       │       └── interceptors/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── test/
│       │   └── *.e2e-spec.ts
│       └── Dockerfile
├── packages/                         # Unit 1: Shared
│   ├── shared-types/
│   │   ├── src/
│   │   │   ├── drug.types.ts
│   │   │   ├── interaction.types.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── eslint-config/
│   └── tsconfig/
├── turbo.json
├── package.json
├── .github/                          # Unit 5: CI/CD
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
└── .env.example
```
