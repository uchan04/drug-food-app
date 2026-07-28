/**
 * Health check types
 */

/** Health check status */
export type HealthStatus = 'ok' | 'degraded' | 'down';

/** Shallow health check response */
export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number; // seconds
}

/** Deep health check response */
export interface DeepHealthCheckResponse extends HealthCheckResponse {
  checks: {
    database: {
      status: HealthStatus;
      responseTime: number; // ms
    };
  };
}
