import { existsSync, readFileSync } from 'node:fs';

/**
 * .env 를 읽어 비어 있는 환경변수만 채운다.
 *
 * Prisma CLI 는 .env 를 읽어 주지만 node 로 직접 돌리는 스크립트는 아무도
 * 읽지 않는다 (seed.ts 를 직접 돌렸을 때 P1012 가 났던 이유다). dotenv 를
 * 추가하는 대신 이미 설정된 값은 건드리지 않는다. CI 처럼 환경변수가 먼저
 * 설정된 곳에서는 아무 일도 하지 않는다.
 */
export function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
