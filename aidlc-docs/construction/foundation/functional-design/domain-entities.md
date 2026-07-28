# Domain Entities - Unit 1: Foundation

## Entity Relationship Diagram (ERD)

```
+------------------+       +----------------------+       +------------------+
|      users       |       |   medicine_boxes     |       |      drugs       |
+------------------+       +----------------------+       +------------------+
| id (PK)          |<──┐   | id (PK)              |   ┌──>| id (PK)          |
| email            |   |   | user_id (FK)         |───┘   | name_ko          |
| name             |   └───| drug_id (FK)         |       | name_en          |
| password_hash    |       | added_at             |       | category         |
| provider         |       +----------------------+       | description_ko   |
| provider_id      |                                      | description_en   |
| language         |                                      | created_at       |
| created_at       |                                      +------------------+
| updated_at       |                                              |
+------------------+                                              | 1:N
                                                                  v
+------------------+       +----------------------+       +------------------+
|      foods       |       |    interactions      |       | drug_ingredients |
+------------------+       +----------------------+       +------------------+
| id (PK)          |<──┐   | id (PK)              |   ┌──>| id (PK)          |
| name_ko          |   |   | ingredient_id (FK)   |───┘   | drug_id (FK)     |
| name_en          |   └───| food_id (FK)         |       | name_ko          |
| category         |       | risk_level           |       | name_en          |
| nutrients        |       | reason_ko            |       +------------------+
| created_at       |       | reason_en            |
+------------------+       | side_effects_ko      |
                           | side_effects_en      |
                           | time_gap_hours       |
                           | created_at           |
                           +----------------------+
```

---

## Entities Detail

### 1. User

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto-gen | Primary key |
| email | String | No | - | Unique, 이메일 주소 |
| name | String | No | - | 표시 이름 |
| password_hash | String | Yes | null | 이메일 로그인 시 bcrypt 해시 (OAuth는 null) |
| provider | Enum | No | 'email' | 'email' \| 'google' \| 'kakao' |
| provider_id | String | Yes | null | OAuth 제공자의 사용자 ID |
| language | Enum | No | 'ko' | 'ko' \| 'en' |
| refresh_token | String | Yes | null | 현재 리프레시 토큰 해시 |
| created_at | DateTime | No | now() | 생성 시각 |
| updated_at | DateTime | No | now() | 수정 시각 |

**인덱스**: `UNIQUE(email)`, `UNIQUE(provider, provider_id)`

---

### 2. Drug (약물/제품)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto-gen | Primary key |
| name_ko | String | No | - | 제품명 (한국어) |
| name_en | String | No | - | 제품명 (영어) |
| category | String | No | - | 약물 분류 (예: 고혈압약, 항생제) |
| description_ko | String | Yes | null | 설명 (한국어) |
| description_en | String | Yes | null | 설명 (영어) |
| created_at | DateTime | No | now() | 생성 시각 |

**인덱스**: `GIN(name_ko gin_trgm_ops)`, `GIN(name_en gin_trgm_ops)`, full-text index

---

### 3. DrugIngredient (약물 성분)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto-gen | Primary key |
| drug_id | UUID (FK) | No | - | 소속 약물 |
| name_ko | String | No | - | 성분명 (한국어) |
| name_en | String | No | - | 성분명 (영어) |

**인덱스**: `INDEX(drug_id)`, `GIN(name_ko gin_trgm_ops)`

---

### 4. Food (음식)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto-gen | Primary key |
| name_ko | String | No | - | 음식명 (한국어) |
| name_en | String | No | - | 음식명 (영어) |
| category | String | No | - | 음식 분류 (과일, 유제품, 음료 등) |
| nutrients | String[] | No | [] | 주요 영양소/성분 (칼륨, 비타민K 등) |
| created_at | DateTime | No | now() | 생성 시각 |

---

### 5. Interaction (약-음식 상호작용)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto-gen | Primary key |
| ingredient_id | UUID (FK) | No | - | 관련 약물 성분 |
| food_id | UUID (FK) | No | - | 관련 음식 |
| risk_level | Enum | No | - | 'caution' \| 'warning' \| 'contraindicated' |
| reason_ko | String | No | - | 상호작용 이유 (한국어) |
| reason_en | String | No | - | 상호작용 이유 (영어) |
| side_effects_ko | String | No | - | 부작용 설명 (한국어) |
| side_effects_en | String | No | - | 부작용 설명 (영어) |
| time_gap_hours | Int | Yes | null | 권장 시간 간격 (시간) |
| created_at | DateTime | No | now() | 생성 시각 |

**인덱스**: `INDEX(ingredient_id)`, `INDEX(food_id)`, `UNIQUE(ingredient_id, food_id)`

---

### 6. MedicineBox (약상자 아이템)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto-gen | Primary key |
| user_id | UUID (FK) | No | - | 소유 사용자 |
| drug_id | UUID (FK) | No | - | 등록된 약물 |
| added_at | DateTime | No | now() | 추가 시각 |

**인덱스**: `INDEX(user_id)`, `UNIQUE(user_id, drug_id)` (중복 방지)

---

## Relationships Summary

| 관계 | Type | Description |
|------|------|-------------|
| User → MedicineBox | 1:N | 한 사용자는 여러 약상자 아이템 보유 |
| Drug → DrugIngredient | 1:N | 한 약물은 여러 성분 포함 |
| Drug → MedicineBox | 1:N | 한 약물은 여러 사용자의 약상자에 존재 |
| DrugIngredient → Interaction | 1:N | 한 성분은 여러 음식과 상호작용 |
| Food → Interaction | 1:N | 한 음식은 여러 성분과 상호작용 |

---

## Testable Properties (PBT-01)

| 컴포넌트 | 속성 카테고리 | 테스트 대상 |
|----------|-------------|-------------|
| Drug 직렬화 | Round-trip | Drug entity → API DTO → Drug entity |
| Interaction 직렬화 | Round-trip | Interaction entity → Report DTO → verify fields |
| MedicineBox 상태 | Invariant | 추가 후 개수 +1, 삭제 후 -1, 중복 불가 |
| RiskLevel 분류 | Invariant | 모든 상호작용은 3단계 중 하나 (exhaustive) |
| 검색 결과 | Invariant | 검색 결과는 항상 query 문자열 관련 (similarity > 0) |
