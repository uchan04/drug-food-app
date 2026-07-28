# Unit of Work - Functional Requirements Mapping

## 기능 요구사항 → 유닛 매핑

| Requirement | 설명 | Unit(s) | 구현 범위 |
|-------------|------|---------|-----------|
| **FR-01** | 약물 검색 | Unit 1 (타입+스키마), Unit 3 (API), Unit 4 (UI) | 검색 엔드포인트 + 자동완성 + 프론트 검색 폼 |
| **FR-02** | 내 약상자 | Unit 1 (타입+스키마), Unit 3 (API), Unit 4 (UI) | CRUD API + 약상자 관리 페이지 |
| **FR-03** | 약-음식 상성 분석 | Unit 1 (타입+스키마), Unit 3 (분석 엔진), Unit 4 (결과 UI) | 분석 알고리즘 + 리포트 표시 |
| **FR-04** | 상성 결과 리포트 | Unit 3 (데이터 구조), Unit 4 (시각화) | 위험도별 색상 구분 + 음식 목록 |
| **FR-05** | 상세 가이드 | Unit 3 (데이터), Unit 4 (UI) | Post-MVP (구조만 설계) |
| **FR-06** | 사용자 인증 | Unit 1 (타입+스키마), Unit 2 (API), Unit 4 (UI) | JWT + OAuth + 로그인/가입 폼 |
| **FR-07** | 다국어 지원 | Unit 1 (다국어 컬럼), Unit 3 (lang 파라미터), Unit 4 (next-intl) | DB 다국어 + API lang + 프론트 번역 |

---

## 비기능 요구사항 → 유닛 매핑

| Requirement | 설명 | Unit(s) |
|-------------|------|---------|
| **NFR-01** | 성능 | Unit 3 (검색 인덱스, 쿼리 최적화), Unit 4 (TanStack Query 캐싱) |
| **NFR-02** | 가용성 | Unit 5 (AWS 멀티 AZ, 헬스체크) |
| **NFR-03** | 확장성 | Unit 1 (DB 설계), Unit 5 (오토스케일링) |
| **NFR-04** | 유지보수성 | Unit 1 (모노레포 구조, 공유 설정) |
| **NFR-05** | 접근성 | Unit 4 (shadcn/ui WCAG, 반응형) |

---

## 확장 규칙 → 유닛 매핑

| Extension Rule | 유닛 | 적용 내용 |
|----------------|------|-----------|
| Resiliency (Health Check) | Unit 2 | `/api/health`, `/api/health/deep` |
| Resiliency (Timeout/Circuit) | Unit 3 | 외부 호출 타임아웃 (해당 시 적용) |
| Resiliency (Backup) | Unit 5 | RDS 자동 백업 설정 |
| Resiliency (Monitoring) | Unit 5 | 로깅, 메트릭, 알림 설정 |
| PBT (Round-trip) | Unit 1, 3 | 직렬화/역직렬화 테스트 |
| PBT (Invariant) | Unit 3 | 상성 분석 엔진 (위험도 분류) |
| PBT (Stateful) | Unit 3, 4 | 약상자 상태 관리 |
| PBT (Generator) | Unit 3 | 도메인 객체 생성기 (Drug, Interaction) |

---

## 유닛별 구현 체크리스트

### Unit 1: Foundation
- [ ] Turborepo 모노레포 세팅
- [ ] shared-types 패키지 (모든 API 타입)
- [ ] Prisma 스키마 (전체 테이블)
- [ ] 시드 데이터 (약물 100개+, 음식, 상호작용)
- [ ] ESLint/TypeScript 공유 설정
- [ ] .env.example

### Unit 2: Backend Auth
- [ ] NestJS 앱 부트스트랩
- [ ] Prisma Service
- [ ] Auth Module (register, login, OAuth, refresh, reset)
- [ ] User Module (profile CRUD)
- [ ] Common (guards, filters, pipes)
- [ ] Health Check

### Unit 3: Backend Domain
- [ ] Drug Module (search, autocomplete, detail)
- [ ] Medicine Box Module (CRUD)
- [ ] Interaction Module (분석 엔진)
- [ ] pg_trgm + full-text 검색 인덱스
- [ ] PBT 테스트 (fast-check)

### Unit 4: Frontend
- [ ] Next.js App Router 구조
- [ ] NextAuth.js 연동
- [ ] 검색 페이지 + 자동완성
- [ ] 약상자 페이지
- [ ] 상성 분석 결과 페이지
- [ ] 인증 UI (로그인/가입)
- [ ] shadcn/ui 컴포넌트
- [ ] next-intl 국제화 (ko/en)
- [ ] 반응형 디자인

### Unit 5: Infra
- [ ] GitHub Actions CI (lint, test, build)
- [ ] GitHub Actions CD (deploy)
- [ ] Dockerfile (backend)
- [ ] docker-compose.yml (로컬 개발)
- [ ] Vercel 설정 (frontend)
- [ ] AWS 배포 가이드
