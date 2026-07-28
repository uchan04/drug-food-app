# Code Summary - Unit 4: Frontend

## 생성된 파일 목록

### Config & Styles
| 파일 | 용도 |
|------|------|
| `apps/web/next.config.js` | Next.js 설정 (transpilePackages) |
| `apps/web/tailwind.config.ts` | Tailwind CSS (커스텀 risk 색상) |
| `apps/web/postcss.config.js` | PostCSS (Tailwind + Autoprefixer) |
| `apps/web/src/app/globals.css` | 글로벌 스타일 + risk 유틸리티 클래스 |

### i18n Messages
| 파일 | 용도 |
|------|------|
| `apps/web/messages/ko.json` | 한국어 번역 |
| `apps/web/messages/en.json` | 영어 번역 |

### Core Infrastructure
| 파일 | 용도 |
|------|------|
| `apps/web/src/lib/api-client.ts` | API 클라이언트 (drug, medicineBox, interaction, auth) |
| `apps/web/src/app/providers.tsx` | TanStack Query Provider |

### Layout & Navigation
| 파일 | 용도 |
|------|------|
| `apps/web/src/app/layout.tsx` | 루트 레이아웃 (metadata, Providers, Header) |
| `apps/web/src/app/page.tsx` | 홈 페이지 (검색) |
| `apps/web/src/components/layout/header.tsx` | 헤더 + 네비게이션 |

### Search Components
| 파일 | 용도 |
|------|------|
| `apps/web/src/components/search/search-bar.tsx` | 검색 입력 (디바운스 300ms) |
| `apps/web/src/components/search/search-results.tsx` | 검색 결과 목록 + 약상자 추가 버튼 |

### Medicine Box
| 파일 | 용도 |
|------|------|
| `apps/web/src/app/medicine-box/page.tsx` | 약상자 페이지 |
| `apps/web/src/components/medicine-box/medicine-box-list.tsx` | 약상자 목록 + 제거 버튼 |

### Analysis
| 파일 | 용도 |
|------|------|
| `apps/web/src/app/analysis/page.tsx` | 분석 페이지 |
| `apps/web/src/components/analysis/interaction-report.tsx` | 상호작용 리포트 (요약 + 상세) |
| `apps/web/src/components/analysis/risk-badge.tsx` | 위험도 배지 (주의/경고/금기) |

### Auth Pages
| 파일 | 용도 |
|------|------|
| `apps/web/src/app/auth/login/page.tsx` | 로그인 (이메일 + Google + Kakao) |
| `apps/web/src/app/auth/register/page.tsx` | 회원가입 |

---

## 총 파일 수: 20개

## UI 페이지 구현

| 경로 | 기능 | Auth |
|------|------|------|
| `/` | 홈 (약물 검색 + 결과) | No |
| `/medicine-box` | 내 약상자 | Yes |
| `/analysis` | 상성 분석 결과 | Yes |
| `/auth/login` | 로그인 | No |
| `/auth/register` | 회원가입 | No |

## UI/UX 특징
- **검색**: 디바운스 300ms, 2자 이상 자동 검색
- **위험도 표시**: 색상 구분 (노랑/주황/빨강) + 아이콘 + 배지
- **반응형**: Tailwind CSS 모바일 우선
- **접근성**: aria-label, role, data-testid, semantic HTML, 폼 label
- **다국어**: ko.json / en.json 메시지 파일 (20+ 키)
- **data-testid**: 모든 인터랙티브 요소에 자동화 친화 ID
