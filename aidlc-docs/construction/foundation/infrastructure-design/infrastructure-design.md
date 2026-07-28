# Infrastructure Design - Unit 1: Foundation

## 개요

Unit 1은 데이터베이스 스키마, 시드 데이터, 공유 패키지를 정의합니다. 이 유닛의 인프라는 **개발 환경 + 데이터베이스** 중심입니다.

---

## 1. 데이터베이스 인프라

### 프로덕션: AWS RDS PostgreSQL

| 항목 | 설정 |
|------|------|
| **서비스** | AWS RDS for PostgreSQL |
| **엔진 버전** | PostgreSQL 15.x |
| **인스턴스 클래스** | db.t3.micro (초기) → db.t3.small (성장 시) |
| **스토리지** | 20GB gp3 (auto-scaling 활성화, 최대 100GB) |
| **멀티 AZ** | No (단일 AZ — Backup & Restore 전략에 부합) |
| **자동 백업** | 활성화, 보존 7일 |
| **암호화** | AES-256 (AWS KMS managed key) |
| **파라미터 그룹** | 커스텀 (statement_timeout=10000, pg_trgm 활성화) |
| **VPC** | Private subnet (API 서버에서만 접근) |

### 로컬 개발: Docker Compose PostgreSQL

```yaml
# docker-compose.yml (로컬 개발용)
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: drug_food_checker
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 2. 패키지 레지스트리

| 항목 | 설정 |
|------|------|
| **패키지 매니저** | pnpm 8+ |
| **워크스페이스** | pnpm-workspace.yaml |
| **내부 패키지** | workspace:* 프로토콜 (shared-types 등) |
| **빌드 캐시** | Turborepo Local Cache (CI에서 Remote Cache 고려) |
| **Node.js** | 20 LTS (.nvmrc 또는 .node-version 파일) |

---

## 3. 개발 도구 인프라

| 도구 | 용도 | 설정 위치 |
|------|------|-----------|
| Docker Desktop | 로컬 PostgreSQL | docker-compose.yml |
| pnpm | 의존성 관리 | pnpm-workspace.yaml |
| Turborepo | 빌드 파이프라인 | turbo.json |
| Prisma Studio | DB GUI (개발용) | `pnpm prisma studio` |
| Vitest | 테스트 실행 | vitest.config.ts |

---

## 4. 환경별 설정

| 환경 | DB | 용도 |
|------|-----|------|
| **local** | Docker PostgreSQL (localhost:5432) | 개발 |
| **test** | Docker PostgreSQL (별도 DB명) | CI 테스트 |
| **production** | AWS RDS (private endpoint) | 프로덕션 |

---

## 5. 보안 설정

### 데이터베이스 접근 제어
- **프로덕션**: Security Group으로 API 서버 IP만 허용
- **로컬**: localhost만 접근 가능
- **Credentials**: AWS Secrets Manager (프로덕션), .env (로컬)

### 환경 변수 관리
- `.env.local` — 로컬 개발 (gitignore)
- `.env.example` — 템플릿 (커밋)
- AWS Secrets Manager / SSM Parameter Store — 프로덕션

---

## 6. Resiliency Compliance

| Rule | Status | Unit 1 적용 |
|------|--------|-------------|
| RESILIENCY-10 | ✅ | statement_timeout=10000, connect_timeout=5000 |
| RESILIENCY-12 | ✅ | RDS 자동 백업 7일, AES-256 암호화 |
| RESILIENCY-08 | ⚠️ N/A | 단일 AZ (Backup & Restore 전략 — RTO 시간 단위 허용) |
