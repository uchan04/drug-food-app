# Code Generation Plan - Unit 3: Backend Domain

## Unit Context
- **유닛명**: Backend Domain
- **유형**: Service Module (핵심 비즈니스 로직)
- **의존**: Unit 1 (shared-types, Prisma), Unit 2 (Auth guards, Prisma service)
- **산출물 위치**: `apps/api/src/` (drug, medicine-box, interaction)

## Stage Skip Rationale
- **Functional Design**: Skip — 비즈니스 로직은 이미 Unit 1 Functional Design에서 상세 정의됨 (검색 알고리즘, 분석 플로우, 비즈니스 규칙).
- **NFR/Infrastructure**: Skip — Unit 1에서 모두 캡처됨.

## Story Mapping
- FR-01: 약물 검색 (제품명/성분명, 자동완성)
- FR-02: 내 약상자 (CRUD, 최대 20개 제한)
- FR-03: 약-음식 상성 분석 (3단계 위험도)
- FR-04: 상성 결과 리포트

---

## Generation Steps

### Step 1: Drug Module
- [ ] `apps/api/src/drug/drug.module.ts`
- [ ] `apps/api/src/drug/drug.controller.ts`
- [ ] `apps/api/src/drug/drug.service.ts`

### Step 2: Medicine Box Module
- [ ] `apps/api/src/medicine-box/medicine-box.module.ts`
- [ ] `apps/api/src/medicine-box/medicine-box.controller.ts`
- [ ] `apps/api/src/medicine-box/medicine-box.service.ts`

### Step 3: Interaction Module (Analysis Engine)
- [ ] `apps/api/src/interaction/interaction.module.ts`
- [ ] `apps/api/src/interaction/interaction.controller.ts`
- [ ] `apps/api/src/interaction/interaction.service.ts`

### Step 4: Update App Module
- [ ] Update `apps/api/src/app.module.ts` (import Drug, MedicineBox, Interaction modules)

### Step 5: PBT Tests (fast-check)
- [ ] `apps/api/test/generators/drug.generator.ts`
- [ ] `apps/api/test/pbt/interaction.pbt.spec.ts`

### Step 6: Documentation Summary
- [ ] `aidlc-docs/construction/backend-domain/code/code-summary.md`

---

## Total: 6 Steps, ~13 files
