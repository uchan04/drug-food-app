# Code Summary - Unit 1: Foundation

## 생성된 파일 목록

### Root (Monorepo)
| 파일 | 용도 |
|------|------|
| `package.json` | Workspace root, pnpm scripts, Turborepo + Prettier |
| `pnpm-workspace.yaml` | apps/* + packages/* 워크스페이스 정의 |
| `turbo.json` | 빌드 파이프라인 (build, dev, lint, test, clean) |
| `.gitignore` | Node, Next.js, Prisma, Docker, IDE 무시 |
| `.nvmrc` | Node 20 LTS |
| `.env.example` | 환경 변수 템플릿 (DB, Auth, OAuth, Next.js) |
| `docker-compose.yml` | PostgreSQL 15 Alpine (로컬 개발) |

### packages/tsconfig/
| 파일 | 용도 |
|------|------|
| `package.json` | 패키지 메타데이터 |
| `base.json` | 기본 TS 설정 (strict, ES2022) |
| `nestjs.json` | NestJS용 (CommonJS, decorators) |
| `nextjs.json` | Next.js용 (JSX, App Router) |

### packages/eslint-config/
| 파일 | 용도 |
|------|------|
| `package.json` | ESLint 플러그인 의존성 |
| `index.js` | 공유 린트 규칙 (TypeScript, import order, prettier) |

### packages/shared-types/src/
| 파일 | 타입 내용 |
|------|-----------|
| `index.ts` | Barrel export |
| `common.types.ts` | Language, PaginatedResult, ApiError, BaseEntity |
| `drug.types.ts` | DrugSearchResult, DrugDetail, AutocompleteItem |
| `food.types.ts` | FoodItem, FoodDetail |
| `interaction.types.ts` | RiskLevel, DrugInteraction, InteractionReport |
| `auth.types.ts` | AuthResult, LoginRequest, RegisterRequest |
| `user.types.ts` | UserProfile, UpdateProfileRequest |
| `medicine-box.types.ts` | MedicineBoxItem, MedicineBoxSummary |
| `health.types.ts` | HealthCheckResponse, DeepHealthCheckResponse |

### apps/api/
| 파일 | 용도 |
|------|------|
| `package.json` | NestJS, Prisma, Passport, fast-check, Vitest |
| `tsconfig.json` | extends nestjs.json |
| `prisma/schema.prisma` | 6 모델, 3 enum, 관계, 인덱스 |
| `prisma/seed.ts` | 12 약물, 16 음식, 22 상호작용 (멱등) |

### apps/web/
| 파일 | 용도 |
|------|------|
| `package.json` | Next.js 14, TanStack Query, Zustand, Tailwind |
| `tsconfig.json` | extends nextjs.json |

---

## 총 파일 수: 31개

## 데이터 모델 요약
- **6 모델**: User, Drug, DrugIngredient, Food, Interaction, MedicineBoxItem
- **3 Enum**: AuthProvider, Language, RiskLevel
- **인덱스**: GIN (trigram), B-Tree, Unique constraints

## 시드 데이터 요약
- **12 약물** (6 카테고리: 고혈압약, 고지혈증약, 항생제, 진통소염제, 통풍약, 항응고제)
- **16 음식** (5 카테고리: 과일, 유제품, 채소, 음료, 기타)
- **22 상호작용** (caution: 4, warning: 10, contraindicated: 8)

## 다음 유닛 의존성
- Unit 2 (Backend Auth): `@drug-food-checker/shared-types`, Prisma schema 활용
- Unit 3 (Backend Domain): `@drug-food-checker/shared-types`, Prisma schema + seed 데이터 활용
- Unit 4 (Frontend): `@drug-food-checker/shared-types`, API 타입 활용
