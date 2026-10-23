/**
 * pipeline/curated/interactions.json 을 Interaction 테이블에 적재한다.
 *
 * seed.ts 가 손으로 적은 행은 출처가 없다 (source = 'seed:manual').
 * 이 스크립트는 식약처 허가사항에서 추출·리뷰한 행으로 그것을 교체한다.
 * source 에 품목기준코드가 들어가므로 어느 허가사항의 어느 문장인지 되짚을 수 있다.
 *
 * Food 는 seed 가 어휘의 주인이다. 여기서는 seed 에 없는 음식만 만든다.
 *
 * JSON 은 파이프라인이 만든다 (pipeline/README.md). 여기서는 적재만 한다.
 * 파이썬에 postgres 드라이버를 추가하지 않고 이미 있는 Prisma 타입을 쓴다.
 *
 *   pnpm --filter api load:interactions
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient, RiskLevel } from '@prisma/client';

import { loadEnvFile } from '../tools/load-env';

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

  // 1. 음식은 전부 seed 에 있어야 한다. seed 가 Food 어휘의 주인이다.
  //
  //    전에는 없으면 여기서 만들었다. 그러면 파이프라인이 seed 와 조금 다른
  //    이름을 쓰기 시작했을 때("식이섬유" vs "고섬유 식품", 은퇴시킨 "소주")
  //    같은 뜻의 Food 가 조용히 두 개가 된다. 알코올이 두 행으로 쪼개져
  //    타이레놀에 알코올 항목이 4개 나왔던 사고가 그것이다 (마이그레이션 0005).
  //    로그 한 줄로는 아무도 안 본다. 멈추는 쪽이 맞다.
  const missing: string[] = [];
  for (const food of payload.foods) {
    if ((await prisma.food.count({ where: { nameKo: food.nameKo } })) === 0) {
      missing.push(food.nameKo);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `seed 에 없는 Food ${missing.length}개: ${missing.join(', ')}\n` +
        'prisma/seed.ts 의 FOODS 에 추가하거나, 기존 음식의 다른 이름이면 ' +
        'pipeline/normalize.py 의 FOOD_ALIAS 로 접으세요.',
    );
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
    const food = await prisma.food.findUnique({ where: { nameKo: row.food } });

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

  console.info(`적재 ${upserted}행 (제안 ${payload.interactions.length}건)`);
  console.info(
    `상호작용 ${total}행: 출처 있음 ${sourced} / 출처 없음(seed:manual) ${after} ` +
      `(적재 전 ${before})`,
  );

  // 로그만 찍고 넘어가면 의료 정보 한 행이 조용히 사라진다. seed 의 Food 이름을
  // 바꾸거나 파이프라인이 음식 이름을 바꾸면 바로 여기서 어긋나는데, 그때
  // "적재 76행" 만 보고 정상이라고 착각하게 된다.
  if (unmatched.length > 0) {
    throw new Error(
      `매칭 실패 ${unmatched.length}건 (적재되지 않았다):\n  ` + unmatched.join('\n  '),
    );
  }
}

main()
  .catch((e) => {
    console.error('적재 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
