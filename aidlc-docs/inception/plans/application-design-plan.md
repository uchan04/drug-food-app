# Application Design Plan

## 설계 범위
약-음식 상성 체커 웹 애플리케이션의 컴포넌트 식별, 서비스 레이어 설계, 의존성 정의

---

## 실행 계획

- [x] 컴포넌트 식별 및 책임 정의
- [x] 컴포넌트 메서드 시그니처 정의
- [x] 서비스 레이어 설계
- [x] 컴포넌트 의존성 및 통신 패턴 정의
- [x] 설계 일관성 검증

---

## 설계 질문

### Q-AD1: API 구조

백엔드 API 구조를 어떻게 설계할까요?

A) RESTful API — 리소스 기반 엔드포인트 (예: /drugs, /interactions, /medicine-box)  
B) GraphQL — 단일 엔드포인트, 클라이언트가 필요한 데이터만 요청  
C) REST + 일부 GraphQL 혼합  
X) 기타 (아래에 직접 기재)

[Answer]: A

---

### Q-AD2: 프론트엔드 상태 관리

프론트엔드 상태 관리 방식에 대한 선호가 있나요?

A) React Server Components + 서버 상태 위주 (Next.js App Router 활용)  
B) 클라이언트 상태 관리 라이브러리 (Zustand, Jotai 등)  
C) React Query/TanStack Query (서버 상태) + 경량 클라이언트 상태  
D) 선호 없음 — AI-DLC가 추천  
X) 기타 (아래에 직접 기재)

[Answer]: D

---

### Q-AD3: 데이터베이스 접근 방식

백엔드에서 데이터베이스 접근을 어떻게 할까요?

A) ORM 사용 (TypeORM / Prisma)  
B) Query Builder (Knex.js)  
C) Raw SQL  
D) 선호 없음 — AI-DLC가 추천  
X) 기타 (아래에 직접 기재)

[Answer]: D

---

### Q-AD4: 인증 구현 방식

인증 시스템 구현 방식에 대한 선호가 있나요?

A) 직접 구현 (JWT + bcrypt + OAuth 클라이언트)  
B) Auth 라이브러리 사용 (NextAuth.js / Auth.js)  
C) 외부 서비스 (Auth0, Supabase Auth, Firebase Auth)  
D) 선호 없음 — AI-DLC가 추천  
X) 기타 (아래에 직접 기재)

[Answer]: D

---

### Q-AD5: 검색 기능 구현

약물 검색 기능의 구현 방식은?

A) DB LIKE/ILIKE 쿼리 (PostgreSQL full-text search)  
B) 전용 검색 엔진 (Elasticsearch / Meilisearch)  
C) PostgreSQL full-text search + trigram 인덱스  
D) 선호 없음 — AI-DLC가 추천  
X) 기타 (아래에 직접 기재)

[Answer]: D

---

### Q-AD6: 프론트엔드 UI 프레임워크

UI 컴포넌트 라이브러리에 대한 선호가 있나요?

A) Tailwind CSS + Headless UI (커스텀 디자인)  
B) shadcn/ui (Tailwind 기반 컴포넌트)  
C) Material UI (MUI)  
D) Ant Design  
E) 선호 없음 — AI-DLC가 추천  
X) 기타 (아래에 직접 기재)

[Answer]: E

---

### Q-AD7: 모노레포 vs 멀티레포

프로젝트 저장소 구조는?

A) 모노레포 (프론트엔드 + 백엔드 하나의 저장소)  
B) 멀티레포 (프론트엔드/백엔드 각각 별도 저장소)  
C) 선호 없음 — AI-DLC가 추천  
X) 기타 (아래에 직접 기재)

[Answer]: C

---

## 작성 안내

각 질문의 `[Answer]:` 태그 뒤에 선택한 옵션을 기재해주세요.
