# NFR Requirements - Unit 1: Foundation

## 용량 계획

| 항목 | 초기값 | 1년 목표 | 비고 |
|------|--------|----------|------|
| 약물 수 | 100-200 | 200-300 | 수동 확장 |
| 음식 수 | 30-50 | 50-80 | 카테고리별 추가 |
| 상호작용 수 | 50-100 | 100-200 | 약물/음식 추가 시 증가 |
| 동시 사용자 | 10-50 | 100+ | 점진적 |
| 총 등록 사용자 | 50-200 | 500+ | |
| DB 크기 | < 100MB | < 500MB | 충분히 소규모 |

---

## 1. 데이터베이스 성능 요구사항

### NFR-DB-01: 쿼리 응답 시간
- 약물 검색 (trigram): < 200ms (100-200 레코드 기준)
- 약상자 조회: < 50ms
- 상성 분석: < 500ms (최대 20개 약물 × 전체 상호작용 매칭)
- 단순 CRUD: < 50ms

### NFR-DB-02: 인덱싱 전략
- GIN 인덱스: drug.name_ko, drug.name_en (trigram)
- GIN 인덱스: drug_ingredients.name_ko (trigram)
- B-Tree 인덱스: interactions.ingredient_id, interactions.food_id
- B-Tree 인덱스: medicine_boxes.user_id
- Unique 인덱스: users.email, medicine_boxes(user_id, drug_id)

### NFR-DB-03: 연결 관리
- Connection Pool: 최소 2, 최대 10 (소규모 적합)
- Connection Timeout: 5초
- Idle Timeout: 30초

---

## 2. 백업 및 복구 요구사항 (RESILIENCY-02, 11, 12)

### NFR-BK-01: 백업 전략
- **DR 전략**: Backup & Restore (RPO/RTO: 시간 단위)
- **자동 백업**: 일일 1회 자동 스냅샷 (AWS RDS)
- **보존 기간**: 7일
- **암호화**: AES-256 (RDS 자동 암호화)

### NFR-BK-02: 복구 절차
- **RTO**: 2-4시간 (RDS 스냅샷 복원)
- **RPO**: 최대 24시간 (일일 백업 간격)
- **검증**: 분기별 백업 복원 테스트 (수동)

---

## 3. 빌드 성능 요구사항

### NFR-BLD-01: Turborepo 빌드
- 전체 빌드 (cold): < 3분
- 증분 빌드 (cache hit): < 30초
- 타입 체크: < 30초
- 린트: < 20초

### NFR-BLD-02: CI 파이프라인
- 전체 CI (lint + test + build): < 5분
- 캐시 활용율: > 70% (Turborepo remote cache)

---

## 4. 모니터링 기반 요구사항 (RESILIENCY-05, 07)

### NFR-MON-01: 로깅
- 구조화된 JSON 로그 (pino/winston)
- 로그 레벨: error, warn, info, debug
- Request correlation ID 포함
- 로그 보존: 30일

### NFR-MON-02: 메트릭 (초기)
- DB 연결 풀 사용률
- API 응답 시간 (P50, P95, P99)
- 에러율 (5xx/4xx)
- Health check 상태

---

## 5. Resiliency 규칙 적용 현황 (Unit 1)

| Rule | 적용 | 상태 | 비고 |
|------|------|------|------|
| RESILIENCY-01 | 워크로드 분류 | 적용 | Medium criticality |
| RESILIENCY-02 | RTO/RPO | 적용 | Hours / Backup & Restore |
| RESILIENCY-05 | 모니터링 | 적용 | 로깅 + 기본 메트릭 |
| RESILIENCY-06 | 헬스체크 | N/A | Unit 2에서 구현 |
| RESILIENCY-08 | 멀티존 | N/A | Unit 5에서 구현 |
| RESILIENCY-09 | 오토스케일링 | N/A | Unit 5에서 구현 |
| RESILIENCY-10 | 타임아웃 | 적용 | DB 연결 타임아웃 |
| RESILIENCY-12 | 백업 | 적용 | 일일 자동 백업, 7일 보존 |
