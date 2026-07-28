# Code Generation Plan - Unit 4: Frontend

## Unit Context
- **유닛명**: Frontend
- **유형**: Application (Next.js 웹 앱)
- **의존**: Unit 1 (shared-types), Unit 2+3 (Backend API)
- **산출물 위치**: `apps/web/`

## Stage Skip Rationale
- **Functional/NFR/Infrastructure**: Skip — UI 컴포넌트는 Application Design에서 정의 완료. 표준 Next.js App Router 패턴.

## Story Mapping
- FR-01: 약물 검색 UI (자동완성 포함)
- FR-02: 내 약상자 UI
- FR-03+04: 상성 분석 결과 표시 (위험도별 색상)
- FR-06: 인증 UI (로그인/가입)
- FR-07: 다국어 (한/영 전환)

---

## Generation Steps

### Step 1: Next.js Config & Tailwind
- [ ] `apps/web/next.config.js`
- [ ] `apps/web/tailwind.config.ts`
- [ ] `apps/web/postcss.config.js`
- [ ] `apps/web/src/app/globals.css`

### Step 2: i18n Messages
- [ ] `apps/web/messages/ko.json`
- [ ] `apps/web/messages/en.json`

### Step 3: API Client & Providers
- [ ] `apps/web/src/lib/api-client.ts`
- [ ] `apps/web/src/app/providers.tsx`

### Step 4: Layout & Navigation
- [ ] `apps/web/src/app/layout.tsx`
- [ ] `apps/web/src/app/page.tsx` (Home = 검색)
- [ ] `apps/web/src/components/layout/header.tsx`

### Step 5: Search Components
- [ ] `apps/web/src/components/search/search-bar.tsx`
- [ ] `apps/web/src/components/search/search-results.tsx`

### Step 6: Medicine Box Page
- [ ] `apps/web/src/app/medicine-box/page.tsx`
- [ ] `apps/web/src/components/medicine-box/medicine-box-list.tsx`

### Step 7: Analysis Page
- [ ] `apps/web/src/app/analysis/page.tsx`
- [ ] `apps/web/src/components/analysis/interaction-report.tsx`
- [ ] `apps/web/src/components/analysis/risk-badge.tsx`

### Step 8: Auth Pages
- [ ] `apps/web/src/app/auth/login/page.tsx`
- [ ] `apps/web/src/app/auth/register/page.tsx`

### Step 9: Documentation Summary
- [ ] `aidlc-docs/construction/frontend/code/code-summary.md`

---

## Total: 9 Steps, ~20 files
