/**
 * Common shared types used across the application
 */

/** Supported languages */
export type Language = 'ko' | 'en';

/** Paginated API response wrapper */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Standard API error response */
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

/** Pagination query parameters */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Base entity with common fields */
export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601
}
