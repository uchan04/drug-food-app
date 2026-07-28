# Code Summary - Unit 3: Backend Domain

## 생성된 파일 목록

### Drug Module
| 파일 | 용도 |
|------|------|
| `apps/api/src/drug/drug.module.ts` | Drug 모듈 |
| `apps/api/src/drug/drug.controller.ts` | GET /drugs/search, /drugs/autocomplete, /drugs/:id |
| `apps/api/src/drug/drug.service.ts` | 검색 (pg_trgm), 자동완성, 상세 조회 |

### Medicine Box Module
| 파일 | 용도 |
|------|------|
| `apps/api/src/medicine-box/medicine-box.module.ts` | MedicineBox 모듈 |
| `apps/api/src/medicine-box/medicine-box.controller.ts` | GET/POST/DELETE /medicine-box |
| `apps/api/src/medicine-box/medicine-box.service.ts` | CRUD + 20개 제한 + 중복 방지 |

### Interaction Module
| 파일 | 용도 |
|------|------|
| `apps/api/src/interaction/interaction.module.ts` | Interaction 모듈 |
| `apps/api/src/interaction/interaction.controller.ts` | GET /interactions/analyze, /interactions/drug/:id |
| `apps/api/src/interaction/interaction.service.ts` | 상성 분석 엔진 (약상자 기반 + 개별 약물) |

### Modified Files
| 파일 | 변경 |
|------|------|
| `apps/api/src/app.module.ts` | Drug, MedicineBox, Interaction 모듈 import 추가 |

### PBT Tests (PBT-02, 03, 07)
| 파일 | 용도 |
|------|------|
| `apps/api/test/generators/drug.generator.ts` | 도메인 생성기 (RiskLevel, TimeGap, DrugName 등) |
| `apps/api/test/pbt/interaction.pbt.spec.ts` | Invariant 테스트 (위험도 분류, 정렬, 요약 합산) |

---

## 총 파일 수: 12개 (신규 11 + 수정 1)

## API Endpoints 구현

| Method | Endpoint | Auth | 상태 |
|--------|----------|------|------|
| GET | /api/drugs/search?q=&lang=&page=&limit= | No | ✅ |
| GET | /api/drugs/autocomplete?q=&lang=&limit= | No | ✅ |
| GET | /api/drugs/:id?lang= | No | ✅ |
| GET | /api/medicine-box | Yes | ✅ |
| POST | /api/medicine-box/items | Yes | ✅ |
| DELETE | /api/medicine-box/items/:id | Yes | ✅ |
| GET | /api/interactions/analyze?lang= | Yes | ✅ |
| GET | /api/interactions/drug/:drugId?lang= | No | ✅ |

## 핵심 비즈니스 로직
- **검색**: PostgreSQL pg_trgm similarity > 0.1, 제품명 + 성분명 동시 검색
- **약상자**: 최대 20개 제한, 중복 방지, 소유권 검증
- **분석 엔진**: 약상자 약물 → 성분 추출 → 상호작용 매칭 → 위험도 정렬 → 리포트 집계

## PBT 적용
- 도메인 생성기 정의 (PBT-07)
- RiskLevel invariant: 항상 3값 중 하나 (PBT-03)
- TimeGap invariant: null 또는 1-72 (PBT-03)
- Summary invariant: 개별 카운트 합 = total (PBT-03)
- Sort invariant: 위험도 내림차순 + 원소 보존 (PBT-03)
