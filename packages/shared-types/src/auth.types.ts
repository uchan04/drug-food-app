/**
 * Authentication-related types
 */

/** OAuth provider options */
export type OAuthProvider = 'google' | 'kakao';

/** Auth provider (includes email) */
export type AuthProvider = 'email' | OAuthProvider;

/** Registration request */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/** Login request */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Token refresh request */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** Authentication result (login/register response) */
export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    language: 'ko' | 'en';
    provider: AuthProvider;
  };
  accessToken: string;
  refreshToken: string;
}

/** Token refresh response */
export interface RefreshTokenResult {
  accessToken: string;
}

/** Forgot password request */
export interface ForgotPasswordRequest {
  email: string;
}

/** Reset password request */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
