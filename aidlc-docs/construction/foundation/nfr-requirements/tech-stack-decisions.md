# Tech Stack Decisions - Unit 1: Foundation

## 확정된 기술 스택

| 기술 | 버전 | 용도 | 선택 근거 |
|------|------|------|-----------|
| **Turborepo** | latest | 모노레포 빌드 오케스트레이션 | 증분 빌드, 원격 캐시, pnpm 호환 |
| **pnpm** | 8+ | 패키지 매니저 | 모노레포 workspace, 빠른 설치, 디스크 효율 |
| **TypeScript** | 5.3+ | 타입 시스템 | 공유 타입, strict 모드, 안전성 |
| **Prisma** | 5+ | ORM / 마이그레이션 | 타입 생성, 스키마 관리, NestJS 통합 |
| **PostgreSQL** | 15+ | 데이터베이스 | trigram, full-text, JSONB, 신뢰성 |
| **pg_trgm** | (extension) | 유사도 검색 | 오타 허용 검색, GIN 인덱스 |
| **ESLint** | 8+ | 린트 | 코드 품질, 일관성 |
| **Prettier** | 3+ | 포매터 | 코드 스타일 통일 |
| **fast-check** | 3+ | PBT 프레임워크 | TypeScript 네이티브, 시드 기반, 축소(shrinking) |
| **Vitest** | 1+ | 테스트 러너 | 빠른 실행, TypeScript 네이티브, fast-check 통합 |

---

## 패키지 버전 관리 전략

- **Exact versions**: 모든 의존성은 정확한 버전으로 고정 (no `^` or `~`)
- **Renovate/Dependabot**: 자동 업데이트 PR 생성 (향후 Unit 5에서 설정)
- **Lock file**: pnpm-lock.yaml 커밋 필수

---

## Node.js 버전

- **Target**: Node.js 20 LTS
- **Engine restriction**: `package.json`에 `engines.node: ">=20"` 명시

---

## PBT 프레임워크 결정 (PBT-09 준수)

| 항목 | 결정 |
|------|------|
| 프레임워크 | fast-check 3.x |
| 테스트 러너 | Vitest |
| 통합 방식 | `@fast-check/vitest` 어댑터 |
| 시드 로깅 | Vitest reporter를 통해 시드 자동 출력 |
| CI 통합 | GitHub Actions에서 PBT 포함 실행, 실패 시 시드 기록 |
| 커스텀 생성기 위치 | `apps/api/test/generators/` |
