# Unit of Work Dependencies

## 의존성 매트릭스

| Unit | Foundation | Backend Auth | Backend Domain | Frontend | Infra |
|------|:---:|:---:|:---:|:---:|:---:|
| **Foundation** | - | - | - | - | - |
| **Backend Auth** | ✓ | - | - | - | - |
| **Backend Domain** | ✓ | ✓ | - | - | - |
| **Frontend** | ✓ | ✓ | ✓ | - | - |
| **Infra** | ✓ | ✓ | ✓ | ✓ | - |

---

## 의존성 상세

### Unit 1: Foundation → (없음)
독립적. 모든 유닛의 기반이 되는 공유 패키지.

### Unit 2: Backend Auth → Unit 1
- `shared-types`에서 Auth/User 타입 import
- Prisma 스키마에서 users, accounts, sessions 테이블 사용
- `tsconfig/` 설정 상속

### Unit 3: Backend Domain → Unit 1, Unit 2
- `shared-types`에서 Drug, Interaction, MedicineBox 타입 import
- Prisma 스키마에서 drugs, foods, interactions, medicine_boxes 테이블 사용
- Auth Guards (Unit 2) 사용하여 인증 보호
- Prisma Service (Unit 2에서 생성) 재사용

### Unit 4: Frontend → Unit 1, Unit 2, Unit 3
- `shared-types`에서 모든 API 타입 import
- Backend API 엔드포인트 호출 (Unit 2: auth, Unit 3: domain)
- NextAuth.js가 Backend Auth API와 통신

### Unit 5: Infra → Unit 1~4
- 모든 앱의 빌드/배포 대상
- Docker 이미지 빌드 (Unit 2+3 통합)
- Vercel 배포 (Unit 4)
- CI 파이프라인이 모든 유닛 테스트 실행

---

## 통신 패턴

```
+------------------+
| Unit 1:          |
| Foundation       |<─────────────────────────────┐
| (shared-types,   |<───────────────────┐         |
|  prisma schema)  |<─────────┐         |         |
+------------------+          |         |         |
                              |         |         |
+------------------+          |         |         |
| Unit 2:          |──────────┘         |         |
| Backend Auth     |<─────────┐         |         |
| (auth, user,     |          |         |         |
|  common, prisma) |          |         |         |
+------------------+          |         |         |
                              |         |         |
+------------------+          |         |         |
| Unit 3:          |──────────┘         |         |
| Backend Domain   |<─────────┐         |         |
| (drug, medicine- |          |         |         |
|  box, interaction|          |         |         |
+------------------+          |         |         |
                              |         |         |
+------------------+          |         |         |
| Unit 4:          |──────────┘         |         |
| Frontend         |────────────────────┘         |
| (Next.js web)    |                              |
+------------------+                              |
                                                  |
+------------------+                              |
| Unit 5:          |──────────────────────────────┘
| Infra            |
| (CI/CD, deploy)  |
+------------------+
```

---

## Critical Path

```
Unit 1 ──→ Unit 2 ──→ Unit 3 ──→ Unit 4 ──→ Unit 5
 (1일)      (2일)      (2일)      (3일)      (1일)
```

- **병렬화 불가**: 각 유닛은 이전 유닛에 직접 의존
- **예외**: Unit 5(Infra)의 CI 부분은 Unit 2 완료 후 병렬 시작 가능
- **총 예상**: 약 9일 (단독 개발자 기준)
