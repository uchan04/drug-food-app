# Component Methods

## Backend API Endpoints (RESTful)

---

### BC-01: Drug Module

| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| GET | `/api/drugs/search` | 약물 검색 | `q: string, lang: string, page: number, limit: number` | `DrugSearchResult[]` |
| GET | `/api/drugs/:id` | 약물 상세 조회 | `id: string` | `DrugDetail` |
| GET | `/api/drugs/autocomplete` | 자동완성 | `q: string, lang: string, limit: number` | `AutocompleteItem[]` |

---

### BC-02: Medicine Box Module

| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| GET | `/api/medicine-box` | 약상자 조회 | (Auth required) | `MedicineBoxItem[]` |
| POST | `/api/medicine-box/items` | 약물 추가 | `{ drugId: string }` | `MedicineBoxItem` |
| DELETE | `/api/medicine-box/items/:id` | 약물 제거 | `id: string` | `void` |

---

### BC-03: Interaction Module

| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| GET | `/api/interactions/analyze` | 약상자 기반 분석 | (Auth required, uses user's box) | `InteractionReport` |
| GET | `/api/interactions/drug/:drugId` | 개별 약물 분석 | `drugId: string` | `DrugInteraction[]` |

---

### BC-04: Auth Module

| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| POST | `/api/auth/register` | 회원가입 | `{ email, password, name }` | `{ user, accessToken }` |
| POST | `/api/auth/login` | 로그인 | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/api/auth/refresh` | 토큰 갱신 | `{ refreshToken }` | `{ accessToken }` |
| POST | `/api/auth/logout` | 로그아웃 | (Auth required) | `void` |
| GET | `/api/auth/oauth/:provider` | OAuth 시작 | `provider: 'google' \| 'kakao'` | Redirect |
| GET | `/api/auth/oauth/:provider/callback` | OAuth 콜백 | OAuth params | `{ user, accessToken }` |
| POST | `/api/auth/forgot-password` | 비밀번호 재설정 요청 | `{ email }` | `void` |
| POST | `/api/auth/reset-password` | 비밀번호 재설정 | `{ token, newPassword }` | `void` |

---

### BC-05: User Module

| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| GET | `/api/users/me` | 내 정보 조회 | (Auth required) | `UserProfile` |
| PATCH | `/api/users/me` | 내 정보 수정 | `{ name?, language? }` | `UserProfile` |
| DELETE | `/api/users/me` | 계정 삭제 | (Auth required) | `void` |

---

## Service Layer Methods

### DrugService

```typescript
interface DrugService {
  search(query: string, lang: string, page: number, limit: number): Promise<PaginatedResult<DrugSearchResult>>;
  getById(id: string, lang: string): Promise<DrugDetail>;
  autocomplete(query: string, lang: string, limit: number): Promise<AutocompleteItem[]>;
}
```

### MedicineBoxService

```typescript
interface MedicineBoxService {
  getUserBox(userId: string): Promise<MedicineBoxItem[]>;
  addItem(userId: string, drugId: string): Promise<MedicineBoxItem>;
  removeItem(userId: string, itemId: string): Promise<void>;
}
```

### InteractionService

```typescript
interface InteractionService {
  analyzeUserBox(userId: string, lang: string): Promise<InteractionReport>;
  analyzeDrug(drugId: string, lang: string): Promise<DrugInteraction[]>;
}
```

### AuthService

```typescript
interface AuthService {
  register(email: string, password: string, name: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string }>;
  logout(userId: string): Promise<void>;
  initiateOAuth(provider: OAuthProvider): string; // redirect URL
  handleOAuthCallback(provider: OAuthProvider, code: string): Promise<AuthResult>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
```

### UserService

```typescript
interface UserService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
  deleteAccount(userId: string): Promise<void>;
}
```

---

## Key Data Types

```typescript
// Drug Types
interface DrugSearchResult {
  id: string;
  productName: string;       // 제품명
  ingredientName: string;    // 성분명
  category: string;          // 약물 분류
  hasInteractions: boolean;  // 상호작용 존재 여부
}

interface DrugDetail extends DrugSearchResult {
  description: string;
  ingredients: DrugIngredient[];
  interactions: DrugInteraction[];
}

// Interaction Types
type RiskLevel = 'caution' | 'warning' | 'contraindicated';

interface DrugInteraction {
  id: string;
  food: FoodItem;
  riskLevel: RiskLevel;
  reason: string;            // 상호작용 원리
  sideEffects: string;       // 부작용
  timeGapAdvice?: string;    // 시간 간격 팁
}

interface InteractionReport {
  drugs: DrugSearchResult[];
  interactions: DrugInteraction[];
  summary: {
    caution: number;
    warning: number;
    contraindicated: number;
  };
}

// User Types
interface UserProfile {
  id: string;
  email: string;
  name: string;
  language: 'ko' | 'en';
  provider: 'email' | 'google' | 'kakao';
}

interface AuthResult {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}
```
