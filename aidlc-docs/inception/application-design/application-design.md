# Application Design - Consolidated

## 프로젝트: 약-음식 상성 체커 (Drug-Food Interaction Checker)

---

## 1. 기술 스택 결정 요약

| 계층 | 기술 | 선택 근거 |
|------|------|-----------|
| 프론트엔드 | Next.js 14+ (App Router) | SSR/SSG 지원, SEO, 빠른 초기 로드 |
| UI 컴포넌트 | shadcn/ui + Tailwind CSS | 접근성 우수, 커스텀 용이, 번들 사이즈 작음 |
| 상태 관리 | TanStack Query + Zustand | 서버 상태 캐싱 + 경량 클라이언트 상태 |
| 백엔드 | NestJS | 모듈화, DI, TypeScript 네이티브, 엔터프라이즈 패턴 |
| ORM | Prisma | 타입 안전, 마이그레이션, NestJS 통합 우수 |
| 데이터베이스 | PostgreSQL 15+ | JSONB, trigram, full-text search, 신뢰성 |
| 검색 | pg_trgm + to_tsvector | 외부 서비스 불필요, MVP에 충분한 성능 |
| 인증 | NextAuth.js (프론트) + Passport.js (백) | Next.js 네이티브 통합, OAuth 내장 |
| 국제화 | next-intl | Next.js App Router 호환, 타입 안전 |
| 저장소 | Turborepo (모노레포) | 공유 타입, 단일 CI/CD, 빌드 캐싱 |
| PBT 프레임워크 | fast-check | TypeScript 네이티브, Vitest/Jest 통합 |
| CI/CD | GitHub Actions | 무료 티어 충분, 모노레포 지원 |

---

## 2. 아키텍처 개요

```
[Browser] ─────> [Vercel CDN] ─────> [Next.js App]
                                          |
                                    TanStack Query
                                          |
                                     REST API (HTTPS)
                                          |
                                    [NestJS API Server]
                                     (AWS ECS Fargate)
                                          |
                                      Prisma Client
                                          |
                                    [PostgreSQL]
                                     (AWS RDS)
```

---

## 3. 컴포넌트 구성

### Frontend (5 모듈)
- **Search Module**: 약물 검색 + 자동완성
- **Medicine Box Module**: 약상자 관리 UI
- **Analysis Report Module**: 상성 결과 시각화
- **Auth UI Module**: 로그인/가입/계정관리
- **Layout & Navigation**: 레이아웃, 네비, 다국어

### Backend (5 모듈)
- **Drug Module**: 약물 검색/조회 API
- **Medicine Box Module**: 약상자 CRUD API
- **Interaction Module**: 상성 분석 엔진
- **Auth Module**: 인증/인가
- **User Module**: 사용자 프로필 관리

### Data Layer (4 리포지토리)
- **Drug Repository**: drugs, drug_ingredients, foods, food_nutrients
- **Interaction Repository**: interactions
- **User Repository**: users, accounts, sessions
- **Medicine Box Repository**: medicine_boxes, medicine_box_items

---

## 4. API 설계 요약 (RESTful)

| 그룹 | 주요 엔드포인트 | Auth |
|------|----------------|------|
| Drug | `GET /api/drugs/search`, `/autocomplete`, `/:id` | 불필요 |
| Medicine Box | `GET/POST/DELETE /api/medicine-box/items` | 필요 |
| Interaction | `GET /api/interactions/analyze`, `/drug/:id` | 약상자 분석은 필요 |
| Auth | `POST /api/auth/register`, `/login`, `/refresh` | 불필요 |
| User | `GET/PATCH/DELETE /api/users/me` | 필요 |
| Health | `GET /api/health`, `/api/health/deep` | 불필요 |

---

## 5. 모노레포 구조 (Turborepo)

```
drug-food-checker/
├── apps/
│   ├── web/                  (Next.js frontend)
│   │   ├── app/              (App Router pages)
│   │   ├── components/       (UI components)
│   │   ├── lib/              (utilities, API client)
│   │   ├── hooks/            (custom hooks)
│   │   ├── stores/           (Zustand stores)
│   │   └── messages/         (i18n translations)
│   └── api/                  (NestJS backend)
│       ├── src/
│       │   ├── drug/         (Drug module)
│       │   ├── medicine-box/ (MedicineBox module)
│       │   ├── interaction/  (Interaction module)
│       │   ├── auth/         (Auth module)
│       │   ├── user/         (User module)
│       │   ├── common/       (Guards, Filters, Pipes)
│       │   └── prisma/       (Prisma service)
│       └── prisma/
│           ├── schema.prisma
│           ├── migrations/
│           └── seed.ts
├── packages/
│   ├── shared-types/         (API 요청/응답 타입 공유)
│   ├── eslint-config/
│   └── tsconfig/
├── turbo.json
├── package.json
└── .github/workflows/
```

---

## 6. 핵심 설계 결정 사항

### 6.1 인증 전략
- **프론트엔드**: NextAuth.js가 세션 쿠키 관리 → API 호출 시 JWT 헤더 추가
- **백엔드**: Passport.js JWT Strategy로 토큰 검증
- **토큰**: Access Token (15분) + Refresh Token (7일)

### 6.2 검색 전략
- PostgreSQL `pg_trgm` 확장으로 유사도 검색 (오타 허용)
- `to_tsvector` + `to_tsquery`로 full-text search
- GIN 인덱스로 검색 성능 최적화
- 디바운스 (300ms) 적용된 자동완성

### 6.3 다국어 전략
- 프론트: `next-intl` — 라우트 프리픽스 없는 쿠키 기반 locale
- 백엔드: Accept-Language 헤더 → 약물/음식 이름 해당 언어로 반환
- DB: `name_ko`, `name_en` 컬럼으로 다국어 저장

### 6.4 상성 분석 알고리즘
1. 사용자 약상자에서 모든 약물 조회
2. 각 약물의 성분(ingredient) 추출
3. 성분별 음식 상호작용 데이터 매칭
4. Risk Level 기반 정렬 (금기 > 경고 > 주의)
5. 중복 제거 후 리포트 생성

---

## 참조 문서
- Components: `components.md`
- Component Methods: `component-methods.md`
- Services: `services.md`
- Component Dependencies: `component-dependency.md`
