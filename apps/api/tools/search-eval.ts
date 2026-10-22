/**
 * 약품명 검색 품질을 측정한다. Recall@1 / Recall@5 / MRR.
 *
 * DrugService.search 를 직접 호출한다. trigram 검색이 Postgres 안에 있어서
 * DB 없이는 측정할 수 없다. HTTP 대신 서비스를 직접 부르는 이유는 서버를
 * 띄우지 않아도 되고 측정 대상이 검색 로직 자체이기 때문이다.
 *
 * 평가셋(tools/search-queries.tsv)은 커밋되어 있다. 유형별로 나눈 이유는
 * 전체 평균만 보면 어느 입력에서 깨지는지 안 보이기 때문이다.
 *
 *   pnpm --filter api eval:search
 *   pnpm --filter api eval:search -- --check   # 하한 미달이면 0 아닌 코드로 종료
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';

import { DrugService } from '../src/drug/drug.service';
import type { PrismaService } from '../src/prisma/prisma.service';

import { loadEnvFile } from './load-env';

loadEnvFile(join(__dirname, '..', '.env'));

const QUERIES = join(__dirname, 'search-queries.tsv');
// 상위 몇 개까지 보고 순위를 매길지. Recall@5 보다 넉넉히 둬서 정답이
// 5위 밖 어디에 있는지도 MRR 에 반영된다.
const DEPTH = 10;

// CI 하한. 측정값보다 낮게 잡아서 통계적 요동이 아니라 실제 퇴행만 걸리게 한다.
// 올릴 때는 측정값과 함께 올린다.
//
// R@5 는 하한으로 쓰지 않는다. 약이 26개뿐이라 상위 5개가 코퍼스의 19%고,
// 정렬이 완전히 망가져 있어도 100%가 나왔다 (실제로 그랬다). 코퍼스가
// 42,713 품목으로 커지면 의미가 생긴다. 지금 민감한 지표는 R@1 과 MRR 이다.
const MIN_RECALL_AT_1 = 0.95;
const MIN_MRR = 0.97;
const MIN_AC_RECALL_AT_1 = 0.95;

interface Row {
  query: string;
  lang: 'ko' | 'en';
  expect: string[];
  type: string;
}

function load(): Row[] {
  return readFileSync(QUERIES, 'utf-8')
    .split('\n')
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => {
      const [query, lang, expect, type] = l.split('\t');
      return { query, lang: lang as 'ko' | 'en', expect: expect.split(','), type };
    });
}

/** 정답의 1-based 순위. 없으면 0. */
function rankOf(ids: string[], expect: string[]) {
  for (let i = 0; i < ids.length; i += 1) {
    if (expect.includes(ids[i])) return i + 1;
  }
  return 0;
}

interface Metric {
  n: number;
  r1: number;
  r5: number;
  mrr: number;
}

function metric(ranks: number[]): Metric {
  const n = ranks.length;
  return {
    n,
    r1: ranks.filter((r) => r === 1).length / n,
    r5: ranks.filter((r) => r >= 1 && r <= 5).length / n,
    mrr: ranks.reduce((a, r) => a + (r ? 1 / r : 0), 0) / n,
  };
}

async function main() {
  const prisma = new PrismaClient();
  const service = new DrugService(prisma as unknown as PrismaService);
  const rows = load();

  const results: { row: Row; rank: number; top: string[] }[] = [];
  // autocomplete 도 같은 평가셋으로 잰다. 검색창 드롭다운이라 1위가 중요하고,
  // 약품 결과와 성분 결과를 합치는 지점에 랭킹 문제가 있었다.
  const acRanks: number[] = [];
  for (const row of rows) {
    const res = await service.search(row.query, row.lang, 1, DEPTH);
    const ids = res.data.map((d) => d.id);
    results.push({ row, rank: rankOf(ids, row.expect), top: ids });

    const ac = await service.autocomplete(row.query, row.lang, DEPTH);
    acRanks.push(rankOf(ac.map((a) => a.id), row.expect));
  }
  await prisma.$disconnect();

  const byType = new Map<string, number[]>();
  for (const r of results) {
    if (!byType.has(r.row.type)) byType.set(r.row.type, []);
    byType.get(r.row.type)!.push(r.rank);
  }

  const pct = (x: number) => (x * 100).toFixed(1).padStart(5) + '%';
  console.info(`유형            n   R@1     R@5     MRR`);
  for (const [type, ranks] of [...byType.entries()].sort()) {
    const m = metric(ranks);
    console.info(
      `${type.padEnd(14)} ${String(m.n).padStart(3)} ${pct(m.r1)} ${pct(m.r5)}  ${m.mrr.toFixed(3)}`,
    );
  }
  const all = metric(results.map((r) => r.rank));
  console.info(
    `${'전체'.padEnd(13)} ${String(all.n).padStart(3)} ${pct(all.r1)} ${pct(all.r5)}  ${all.mrr.toFixed(3)}`,
  );

  const ac = metric(acRanks);
  console.info(
    `\n${'autocomplete'.padEnd(14)} ${String(ac.n).padStart(3)} ${pct(ac.r1)} ${pct(ac.r5)}  ${ac.mrr.toFixed(3)}`,
  );

  // 1위를 놓친 것을 전부 보여준다. 약이 26개뿐이라 R@5 는 거의 항상 100%가
  // 되므로, 랭킹 문제는 R@1 실패 목록에서만 드러난다.
  const notFirst = results.filter((r) => r.rank !== 1);
  if (notFirst.length) {
    console.info(`\n1위가 아닌 ${notFirst.length}건:`);
    for (const m of notFirst) {
      console.info(
        `  [${m.row.type.padEnd(13)}] ${m.row.query.padEnd(18)} -> ${m.row.expect.join(',')} ` +
          `순위 ${String(m.rank || '없음').padStart(2)} | 상위: ${m.top.slice(0, 5).join(' ') || '빈 결과'}`,
      );
    }
  }

  if (process.argv.includes('--check')) {
    const bad: string[] = [];
    if (all.r1 < MIN_RECALL_AT_1) bad.push(`R@1 ${all.r1.toFixed(3)} < ${MIN_RECALL_AT_1}`);
    if (all.mrr < MIN_MRR) bad.push(`MRR ${all.mrr.toFixed(3)} < ${MIN_MRR}`);
    if (ac.r1 < MIN_AC_RECALL_AT_1)
      bad.push(`autocomplete R@1 ${ac.r1.toFixed(3)} < ${MIN_AC_RECALL_AT_1}`);
    if (bad.length) {
      console.error(`검색 품질 퇴행: ${bad.join(', ')}`);
      process.exit(1);
    }
    console.info('\nok search-eval');
  }
}

main().catch((e) => {
  console.error('측정 실패:', e);
  process.exit(1);
});
