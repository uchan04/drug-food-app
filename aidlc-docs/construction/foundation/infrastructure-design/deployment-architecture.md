# Deployment Architecture - Unit 1: Foundation

## 개요

Unit 1의 "배포"는 **데이터베이스 마이그레이션 및 시드** 실행을 의미합니다. 애플리케이션 코드 배포는 Unit 2~5에서 다룹니다.

---

## 1. 마이그레이션 배포 전략

### 로컬 개발

```bash
# 1. Docker DB 시작
docker compose up -d db

# 2. Prisma 마이그레이션 적용
pnpm --filter api prisma migrate dev

# 3. 시드 데이터 삽입
pnpm --filter api prisma db seed
```

### CI 환경 (GitHub Actions)

```yaml
# .github/workflows/ci.yml (관련 부분)
- name: Start test DB
  run: docker compose up -d db

- name: Run migrations
  run: pnpm --filter api prisma migrate deploy

- name: Seed test data
  run: pnpm --filter api prisma db seed
```

### 프로덕션 배포

```bash
# 배포 파이프라인에서 실행 (Unit 5에서 상세 정의)
# 1. 마이그레이션 적용 (API 서버 배포 전)
prisma migrate deploy

# 2. 시드는 프로덕션에서 별도 관리 (초기 1회 또는 admin API)
```

---

## 2. 마이그레이션 안전 규칙

| 규칙 | 설명 |
|------|------|
| **순방향만** | 롤백 마이그레이션 생성 대신 새 마이그레이션으로 수정 |
| **배포 전 실행** | 마이그레이션은 새 코드 배포 전에 완료 |
| **호환성** | 신규 마이그레이션은 이전 코드 버전과 호환되어야 함 |
| **데이터 보존** | DROP/DELETE 포함 마이그레이션은 별도 승인 필요 |
| **테스트** | CI에서 마이그레이션 적용 테스트 필수 |

---

## 3. 전체 시스템 배포 아키텍처 (참조)

```
                    +------------------+
                    |   GitHub Repo    |
                    | (Turborepo mono) |
                    +------------------+
                           |
                    GitHub Actions CI/CD
                           |
              +------------+------------+
              |                         |
    +---------v---------+    +----------v----------+
    |      Vercel       |    |    AWS ECS Fargate  |
    |   (Next.js app)   |    |    (NestJS API)     |
    +-------------------+    +---------------------+
              |                         |
              |    REST API (HTTPS)     |
              +----------+-------------+
                         |
                         v
              +---------------------+
              |    AWS RDS          |
              |    PostgreSQL 15    |
              |    (Private Subnet) |
              +---------------------+
```

**Note**: 이 아키텍처의 상세 구현은 Unit 5 (Infra)에서 다룹니다. Unit 1에서는 PostgreSQL 스키마와 연결 설정만 담당합니다.

---

## 4. 로컬 개발 환경 세팅 순서

```
1. Prerequisites 확인
   - Node.js 20+
   - pnpm 8+
   - Docker Desktop

2. 저장소 클론 및 의존성 설치
   git clone <repo>
   pnpm install

3. 환경 변수 설정
   cp .env.example .env.local

4. 로컬 DB 시작
   docker compose up -d

5. Prisma 마이그레이션
   pnpm --filter api prisma migrate dev

6. 시드 데이터
   pnpm --filter api prisma db seed

7. 개발 서버 시작
   pnpm dev  (Turborepo가 web + api 동시 시작)
```
