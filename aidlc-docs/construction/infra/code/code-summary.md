# Code Summary - Unit 5: CI/CD & Infrastructure

## 생성된 파일 목록

| 파일 | 용도 |
|------|------|
| `.github/workflows/ci.yml` | GitHub Actions CI (lint, test, PBT, build) |
| `apps/api/Dockerfile` | 멀티스테이지 Docker 빌드 (deps → build → prod) |

---

## 총 파일 수: 2개

## CI Pipeline 상세

| Job | Steps |
|-----|-------|
| lint-and-test | Checkout → pnpm → Node → Install → Prisma Generate → Migrate → Seed → Lint → Test → PBT |
| build | Checkout → pnpm → Node → Install → Prisma Generate → Build All |

## Dockerfile 특징
- 3-stage build (최소 이미지 크기)
- Non-root user (nestjs:1001)
- HEALTHCHECK 포함 (/api/health)
- Alpine 기반 (경량)
