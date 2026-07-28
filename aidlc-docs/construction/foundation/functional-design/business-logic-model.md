# Business Logic Model - Unit 1: Foundation

## 개요

Unit 1은 인프라 유닛으로 비즈니스 로직 자체를 구현하지는 않지만, 모든 유닛이 의존하는 **데이터 모델**, **타입 계약**, **시드 데이터**를 정의합니다.

---

## 1. 데이터 모델 설계 결정

### 약물 데이터 구조: 2단계 (제품 → 성분)

```
Drug (제품)
  └── DrugIngredient (성분) [1:N]
        └── Interaction (상호작용) [1:N]
              └── Food (음식) [N:1]
```

**근거**: 
- MVP에 3단계(카테고리 추가) 불필요
- 약물 분류는 Drug.category 필드로 처리
- 향후 성분 카테고리 필요 시 DrugIngredient에 category 필드 추가로 확장 가능

### 다국어 저장: 별도 컬럼 방식

```
name_ko: "아스피린"
name_en: "Aspirin"
```

**근거**:
- 2개 언어만 지원 (ko, en)
- 쿼리가 단순 (`SELECT name_${lang}`)
- 타입 안전성 보장 (각 컬럼이 명시적)
- 인덱싱 용이 (각 컬럼에 개별 GIN 인덱스)

---

## 2. 검색 엔진 설계

### PostgreSQL 기반 검색 전략

```
1단계: Trigram 유사도 검색 (오타 허용)
  - pg_trgm extension 활용
  - similarity(name_ko, query) 또는 similarity(name_en, query)
  - threshold: 0.3 이상

2단계: Full-text Search (정확한 단어 매칭)
  - to_tsvector('korean', name_ko) @@ plainto_tsquery('korean', query)
  - to_tsvector('english', name_en) @@ plainto_tsquery('english', query)

결합: trigram OR full-text, similarity 내림차순 정렬
```

### 검색 쿼리 흐름

```
Input: { query: "아스피", lang: "ko" }
  ↓
Step 1: Sanitize (trim, lowercase where applicable)
  ↓
Step 2: Drug name search (trigram on name_ko)
  ↓
Step 3: Ingredient name search (trigram on drug_ingredients.name_ko)
  ↓
Step 4: Combine results, deduplicate by drug_id
  ↓
Step 5: Sort by similarity DESC, paginate
  ↓
Output: DrugSearchResult[]
```

---

## 3. 시드 데이터 설계

### 약물 카테고리 (6개)

| 카테고리 | 대표 약물 | 성분 예시 |
|----------|-----------|-----------|
| 고혈압약 (ACE 억제제) | 리시노프릴, 에날라프릴 | 리시노프릴, 에날라프릴 |
| 고지혈증약 (스타틴) | 리피토, 크레스토 | 아토르바스타틴, 로수바스타틴 |
| 항생제 (테트라사이클린계) | 독시사이클린, 미노사이클린 | 독시사이클린, 미노사이클린 |
| 진통소염제 (NSAIDs) | 타이레놀, 부루펜 | 아세트아미노펜, 이부프로펜 |
| 통풍약 | 자일로릭 | 알로푸리놀 |
| 항응고제 | 와파린 | 와파린 |

### 음식 카테고리 (5개)

| 카테고리 | 음식 목록 |
|----------|-----------|
| 과일 | 바나나, 자몽, 오렌지 |
| 유제품 | 우유, 치즈, 요거트 |
| 채소 | 시금치, 케일, 브로콜리 |
| 음료 | 알코올(맥주/와인), 커피, 자몽주스 |
| 기타 | 콩가루, 고푸린 음식, 제산제 |

### 상호작용 매핑 (핵심 6개 + 확장)

요구사항에서 제시된 6개 핵심 상호작용을 기반으로, 각 성분-음식 조합에 대해 개별 Interaction 레코드 생성:

| 성분 | 음식 | 위험도 | 시간 간격 |
|------|------|--------|-----------|
| 리시노프릴 | 바나나 | warning | 2h |
| 리시노프릴 | 자몽 | warning | - |
| 아토르바스타틴 | 자몽 | contraindicated | - |
| 아토르바스타틴 | 자몽주스 | contraindicated | - |
| 독시사이클린 | 우유 | warning | 2h |
| 독시사이클린 | 치즈 | warning | 2h |
| 이부프로펜 | 알코올 | contraindicated | - |
| 이부프로펜 | 커피 | caution | 1h |
| 아세트아미노펜 | 알코올 | contraindicated | - |
| 알로푸리놀 | 맥주 | warning | - |
| 알로푸리놀 | 고푸린 음식 | caution | - |
| 와파린 | 시금치 | contraindicated | - |
| 와파린 | 케일 | contraindicated | - |
| 와파린 | 콩가루 | warning | - |

---

## 4. 공유 타입 패키지 구조

```
packages/shared-types/src/
├── index.ts              (barrel export)
├── drug.types.ts         (Drug, DrugIngredient, DrugSearchResult, DrugDetail)
├── food.types.ts         (Food, FoodItem)
├── interaction.types.ts  (Interaction, RiskLevel, InteractionReport, DrugInteraction)
├── auth.types.ts         (AuthResult, LoginRequest, RegisterRequest, OAuthProvider)
├── user.types.ts         (UserProfile, UpdateProfileRequest)
├── medicine-box.types.ts (MedicineBoxItem, AddItemRequest)
├── common.types.ts       (PaginatedResult, Language, ApiError)
└── health.types.ts       (HealthStatus)
```

### 타입 설계 원칙
1. **Request/Response 분리**: 각 API 호출별 명확한 요청/응답 타입
2. **Enum은 문자열 리터럴 유니온**: `type RiskLevel = 'caution' | 'warning' | 'contraindicated'`
3. **ID는 string (UUID)**: 타입 안전을 위해 `type DrugId = string & { __brand: 'DrugId' }` branded type 고려
4. **날짜는 ISO string**: API 경계에서 Date 직렬화 문제 방지
