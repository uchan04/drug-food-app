# NFR Design Patterns - Unit 1: Foundation

## 적용 패턴 요약

| 패턴 | 적용 대상 | 구현 위치 |
|------|-----------|-----------|
| Connection Pool Management | DB 연결 | Prisma Client 설정 |
| Timeout Pattern | DB 쿼리 | Prisma connection/query timeout |
| Index Optimization | 검색 성능 | Prisma schema + migration |
| Structured Logging Foundation | 로깅 기반 | packages/shared-types (log types) |
| Seed Idempotency | 시드 실행 | prisma/seed.ts |

---

## 1. Connection Pool Management

### 설계

```typescript
// prisma/schema.prisma datasource 설정
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 런타임 Prisma Client 설정 (apps/api에서)
// connection_limit=10&pool_timeout=5&connect_timeout=5
```

### 설정값

| 파라미터 | 값 | 근거 |
|----------|-----|------|
| connection_limit | 10 | 소규모 (동시 50명 이하) |
| pool_timeout | 5s | 풀 고갈 시 빠른 실패 |
| connect_timeout | 5s | 네트워크 지연 허용 |

---

## 2. Timeout Pattern (RESILIENCY-10)

### 설계

모든 DB 쿼리에 암시적 타임아웃 적용:

```
Query Timeout: 10초 (기본)
Transaction Timeout: 30초 (복합 작업)
Connection Timeout: 5초
```

Prisma의 내장 타임아웃 메커니즘 활용:
- `DATABASE_URL`에 `&statement_timeout=10000` 추가
- 장시간 쿼리 자동 중단

---

## 3. Index Optimization

### 설계

```sql
-- Trigram 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 약물 검색 인덱스 (유사도)
CREATE INDEX idx_drugs_name_ko_trgm ON drugs USING GIN (name_ko gin_trgm_ops);
CREATE INDEX idx_drugs_name_en_trgm ON drugs USING GIN (name_en gin_trgm_ops);

-- 성분 검색 인덱스
CREATE INDEX idx_ingredients_name_ko_trgm ON drug_ingredients USING GIN (name_ko gin_trgm_ops);

-- 관계 조회 인덱스
CREATE INDEX idx_interactions_ingredient ON interactions (ingredient_id);
CREATE INDEX idx_interactions_food ON interactions (food_id);
CREATE INDEX idx_medicine_boxes_user ON medicine_boxes (user_id);

-- 유니크 제약
CREATE UNIQUE INDEX idx_medicine_boxes_unique ON medicine_boxes (user_id, drug_id);
CREATE UNIQUE INDEX idx_interactions_unique ON interactions (ingredient_id, food_id);
```

---

## 4. Structured Logging Foundation

### 설계

공유 로그 타입 정의 (packages/shared-types):

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  correlationId?: string; // Request tracking
  service: string;        // 'api' | 'web'
  context?: Record<string, unknown>;
}
```

구현은 Unit 2에서 (pino/winston 설정), Unit 1에서는 타입 정의만.

---

## 5. Seed Idempotency

### 설계

시드 스크립트는 **멱등(idempotent)** 으로 설계:

```typescript
// prisma/seed.ts 패턴
async function seed() {
  // upsert 사용 - 이미 존재하면 업데이트, 없으면 생성
  await prisma.drug.upsert({
    where: { id: KNOWN_ID },
    update: { ... },
    create: { ... },
  });
}
```

**PBT 적용 (PBT-04)**: 시드 스크립트의 멱등성을 property-based test로 검증:
- `seed(); seed();` 실행 후 DB 상태가 `seed()` 1회 실행과 동일한지 검증
