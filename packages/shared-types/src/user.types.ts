/**
 * User-related types
 */

import type { AuthProvider } from './auth.types';
import type { Language } from './common.types';

/** User profile (returned by API) */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  language: Language;
  provider: AuthProvider;
  createdAt: string;
}

/** Update profile request */
export interface UpdateProfileRequest {
  name?: string;
  language?: Language;
}
