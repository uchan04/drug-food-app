# Code Summary - Unit 2: Backend Auth

## 생성된 파일 목록

### NestJS Bootstrap
| 파일 | 용도 |
|------|------|
| `apps/api/src/main.ts` | 앱 부트스트랩 (포트 4000, Swagger, CORS, ValidationPipe) |
| `apps/api/src/app.module.ts` | 루트 모듈 (Auth, User, Prisma, Health 통합) |

### Prisma Service
| 파일 | 용도 |
|------|------|
| `apps/api/src/prisma/prisma.module.ts` | Global Prisma 모듈 |
| `apps/api/src/prisma/prisma.service.ts` | PrismaClient 확장 (connect/disconnect lifecycle) |

### Common
| 파일 | 용도 |
|------|------|
| `apps/api/src/common/filters/http-exception.filter.ts` | 글로벌 예외 필터 (표준화 에러 응답) |
| `apps/api/src/common/guards/jwt-auth.guard.ts` | JWT 인증 가드 |
| `apps/api/src/common/decorators/current-user.decorator.ts` | @CurrentUser() 파라미터 데코레이터 |

### Auth Module
| 파일 | 용도 |
|------|------|
| `apps/api/src/auth/auth.module.ts` | Auth 모듈 (Passport 통합) |
| `apps/api/src/auth/auth.controller.ts` | POST /auth/register, /login, /refresh, /logout |
| `apps/api/src/auth/auth.service.ts` | 인증 비즈니스 로직 (bcrypt, JWT, refresh token) |
| `apps/api/src/auth/strategies/jwt.strategy.ts` | Passport JWT Strategy |
| `apps/api/src/auth/dto/register.dto.ts` | 회원가입 DTO (validation) |
| `apps/api/src/auth/dto/login.dto.ts` | 로그인 DTO (validation) |

### User Module
| 파일 | 용도 |
|------|------|
| `apps/api/src/user/user.module.ts` | User 모듈 |
| `apps/api/src/user/user.controller.ts` | GET/PATCH/DELETE /users/me |
| `apps/api/src/user/user.service.ts` | 프로필 CRUD 로직 |
| `apps/api/src/user/dto/update-profile.dto.ts` | 프로필 수정 DTO |

### Health Module
| 파일 | 용도 |
|------|------|
| `apps/api/src/health/health.controller.ts` | GET /health, /health/deep (RESILIENCY-06) |

---

## 총 파일 수: 17개

## API Endpoints 구현

| Method | Endpoint | Auth | 상태 |
|--------|----------|------|------|
| POST | /api/auth/register | No | ✅ |
| POST | /api/auth/login | No | ✅ |
| POST | /api/auth/refresh | No | ✅ |
| POST | /api/auth/logout | Yes | ✅ |
| GET | /api/users/me | Yes | ✅ |
| PATCH | /api/users/me | Yes | ✅ |
| DELETE | /api/users/me | Yes | ✅ |
| GET | /api/health | No | ✅ |
| GET | /api/health/deep | No | ✅ |

## 보안 구현
- bcrypt (salt 10 rounds) 비밀번호 해싱
- JWT Access Token (15분 만료)
- Refresh Token (7일 만료, DB에 해시 저장)
- ValidationPipe (whitelist + forbidNonWhitelisted)
- CORS (프론트엔드 origin만 허용)
