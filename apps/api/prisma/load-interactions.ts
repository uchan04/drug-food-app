/**
 * pipeline/curated/interactions.json 을 Interaction 테이블에 적재한다.
 *
 * 이 저장소의 상호작용 72행은 손으로 적은 것이고 출처가 없다 (source = 'seed:manual').
 * 이 스크립트는 식약처 허가사항에서 추출·리뷰한 행으로 그것을 교체한다.
 * source 에 품목기준코드가 들어가므로 어느 허가사항의 어느 문장인지 되짚을 수 있다.
 *
 * JSON 은 파이프라인이 만든다 (pipeline/README.md). 여기서는 적재만 한다.
 * 파이썬에 postgres 드라이버를 추가하지 않고 이미 있는 Prisma 타입을 쓴다.
 *
 *   pnpm --filter api load:interactions
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient, RiskLevel } from '@prisma/client';

// .env 는 Prisma CLI 가 읽어 준다. 이 스크립트는 node 로 직접 돌아가므로
// 아무도 읽지 않는다 (seed.ts 를 직접 돌렸을 때 P1012 가 났던 이유다).
// dotenv 를 추가하는 대신 이미 설정된 값은 건드리지 않고 빈 것만 채운다.
// CI 처럼 환경변수가 먼저 설정된 곳에서는 이 함수가 아무 일도 하지 않는다.
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

loadEnvFile(join(__dirname, '..', '.env'));

const prisma = new PrismaClient();

const DATA = join(__dirname, '../../../pipeline/curated/interactions.json');

interface Payload {
  foods: { nameKo: string; nameEn: string; category: string; nutrients: string[] }[];
  interactions: {
    ingredient: string;
    food: string;
    riskLevel: RiskLevel;
    reasonKo: string;
    source: string;
    sourceUrl: string;
    itemSeqs: string[];
  }[];
}

async function main() {
  const payload: Payload = JSON.parse(readFileSync(DATA, 'utf-8'));
  const before = await prisma.interaction.count({ where: { source: 'seed:manual' } });

  // 1. seed 에 없는 음식을 만든다. Food 에는 nameKo 유니크 제약이 없어서
  //    upsert 를 쓸 수 없고 찾아본 뒤 만든다.
  let newFoods = 0;
  for (const food of payload.foods) {
    const found = await prisma.food.findFirst({ where: { nameKo: food.nameKo } });
    if (!found) {
      await prisma.food.create({ data: food });
      newFoods += 1;
    }
  }

  // 2. 상호작용을 적재한다. 같은 성분명이 여러 약에 걸려 있으면 모두에 넣는다
  //    (Interaction 은 DrugIngredient 에 달리고, 성분은 약마다 행이 따로 있다).
  const fetchedAt = new Date();
  let upserted = 0;
  const unmatched: string[] = [];

  for (const row of payload.interactions) {
    const ingredients = await prisma.drugIngredient.findMany({
      where: { nameKo: row.ingredient },
    });
    const food = await prisma.food.findFirst({ where: { nameKo: row.food } });

    // 조용히 넘어가면 적재 누락을 모르고 지나간다.
    if (ingredients.length === 0) {
      unmatched.push(`성분 없음: ${row.ingredient}`);
      continue;
    }
    if (!food) {
      unmatched.push(`음식 없음: ${row.food}`);
      continue;
    }

    const data = {
      riskLevel: row.riskLevel,
      reasonKo: row.reasonKo,
      // 영문·부작용은 허가사항에 없다. 지어내지 않고 비워 둔다.
      reasonEn: null,
      sideEffectsKo: null,
      sideEffectsEn: null,
      source: row.source,
      sourceUrl: row.sourceUrl,
      fetchedAt,
    };

    for (const ingredient of ingredients) {
      await prisma.interaction.upsert({
        where: { ingredientId_foodId: { ingredientId: ingredient.id, foodId: food.id } },
        update: data,
        create: { ingredientId: ingredient.id, foodId: food.id, ...data },
      });
      upserted += 1;
    }
  }

  const after = await prisma.interaction.count({ where: { source: 'seed:manual' } });
  const sourced = await prisma.interaction.count({ where: { source: { startsWith: 'mfds:' } } });
  const total = await prisma.interaction.count();

  console.info(`새 Food ${newFoods}개`);
  console.info(`적재 ${upserted}행 (제안 ${payload.interactions.length}건)`);
  if (unmatched.length) {
    console.info(`매칭 실패 ${unmatched.length}건:`);
    unmatched.forEach((u) => console.info(`  - ${u}`));
  }
  console.info(
    `상호작용 ${total}행: 출처 있음 ${sourced} / 출처 없음(seed:manual) ${after} ` +
      `(적재 전 ${before})`,
  );
}

main()
  .catch((e) => {
    console.error('적재 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
