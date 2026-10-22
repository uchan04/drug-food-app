import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DrugService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const drugs = await this.prisma.drug.findMany({
      orderBy: [{ category: 'asc' }, { nameKo: 'asc' }],
      select: {
        id: true,
        nameKo: true,
        nameEn: true,
        category: true,
        // 상호작용은 성분에 달려 있고 약마다 성분이 여러 개일 수 있다.
        // 목록에서 어느 약에 데이터가 얼마나 있는지 보이게 하려고 센다.
        ingredients: { select: { _count: { select: { interactions: true } } } },
      },
    });
    return drugs.map(({ ingredients, ...drug }) => ({
      ...drug,
      interactionCount: ingredients.reduce((n, i) => n + i._count.interactions, 0),
    }));
  }

  async search(query: string, lang: 'ko' | 'en', page: number, limit: number) {
    if (!query || query.length < 1) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const sanitizedQuery = query.trim().slice(0, 100);
    const offset = (page - 1) * limit;
    const nameField = lang === 'ko' ? 'name_ko' : 'name_en';

    // Trigram similarity search on drugs and ingredients
    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name_ko: string;
        name_en: string;
        category: string;
        similarity: number;
        has_interactions: boolean;
      }>
    >(
      `
      SELECT
        d.id,
        d.name_ko,
        d.name_en,
        d.category,
        GREATEST(
          similarity(d.${nameField}, $1),
          COALESCE((
            SELECT MAX(similarity(di.${nameField}, $1))
            FROM drug_ingredients di WHERE di.drug_id = d.id
          ), 0)
        ) as similarity,
        EXISTS(
          SELECT 1 FROM interactions i
          JOIN drug_ingredients di ON di.id = i.ingredient_id
          WHERE di.drug_id = d.id
        ) as has_interactions
      FROM drugs d
      WHERE
        similarity(d.${nameField}, $1) > 0.1
        OR EXISTS(
          SELECT 1 FROM drug_ingredients di
          WHERE di.drug_id = d.id AND similarity(di.${nameField}, $1) > 0.1
        )
      -- DISTINCT ON (d.id) 가 있었다. FROM 절에 JOIN 이 없고 성분 매칭은 상관
      -- 스칼라 서브쿼리라서 약마다 행이 하나뿐이고, 지울 중복이 애초에 없었다.
      -- 그런데 Postgres 는 DISTINCT ON 식을 ORDER BY 맨 앞에 요구하므로
      -- ORDER BY d.id 가 강제되어 관련도 정렬이 깨져 있었다. 결과가 유사도순이
      -- 아니라 약품 ID 순이었다 (아세트아미노펜 검색에 아스피린 d008 이
      -- 타이레놀 d009 보다 먼저 나왔다). 측정값: R@1 0.782 -> 1.000.
      -- d.id 는 동점 처리용이다. 전순서가 없으면 OFFSET 페이징에서 행이
      -- 중복되거나 누락된다.
      ORDER BY similarity DESC, d.id
      LIMIT $2 OFFSET $3
      `,
      sanitizedQuery,
      limit,
      offset,
    );

    // Count total
    const countResult = await this.prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `
      SELECT COUNT(DISTINCT d.id) as count
      FROM drugs d
      WHERE
        similarity(d.${nameField}, $1) > 0.1
        OR EXISTS(
          SELECT 1 FROM drug_ingredients di
          WHERE di.drug_id = d.id AND similarity(di.${nameField}, $1) > 0.1
        )
      `,
      sanitizedQuery,
    );

    const total = Number(countResult[0]?.count || 0);

    const data = results.map((r) => ({
      id: r.id,
      productName: lang === 'ko' ? r.name_ko : r.name_en,
      category: r.category,
      hasInteractions: r.has_interactions,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async autocomplete(query: string, lang: 'ko' | 'en', limit: number) {
    if (!query || query.length < 2) {
      return [];
    }

    const sanitizedQuery = query.trim().slice(0, 100);
    const nameField = lang === 'ko' ? 'name_ko' : 'name_en';

    // Drug name matches
    const drugs = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; similarity: number }>
    >(
      `
      SELECT id, ${nameField} as name, similarity(${nameField}, $1) as similarity
      FROM drugs
      WHERE similarity(${nameField}, $1) > 0.15
      ORDER BY similarity DESC
      LIMIT $2
      `,
      sanitizedQuery,
      limit,
    );

    // Ingredient name matches
    const ingredients = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; similarity: number }>
    >(
      `
      SELECT drug_id as id, ${nameField} as name, similarity(${nameField}, $1) as similarity
      FROM drug_ingredients
      WHERE similarity(${nameField}, $1) > 0.15
      ORDER BY similarity DESC
      LIMIT $2
      `,
      sanitizedQuery,
      limit,
    );

    // 두 결과를 유사도로 합친다. 그냥 이어 붙이면 약품 결과가 항상 먼저
    // 와서, 성분명을 정확히 입력해도 덜 비슷한 약품명이 1위가 된다
    // (아토르바스타틴 검색에 심바스타틴이 먼저 나왔다).
    // 양쪽에서 ceil(limit/2) 씩 받던 것도 limit 씩으로 바꿨다. 한쪽이 더 좋은
    // 후보를 다 갖고 있어도 절반만 들어오던 문제가 있었다.
    const seen = new Set<string>();
    return [
      ...drugs.map((d) => ({ ...d, type: 'product' as const })),
      ...ingredients.map((i) => ({ ...i, type: 'ingredient' as const })),
    ]
      // 이름이 같으면 동점 처리가 흔들리므로 이름으로 전순서를 만든다.
      .sort((a, b) => b.similarity - a.similarity || a.name.localeCompare(b.name))
      // 제품명과 성분명이 같은 약은 두 번 걸린다 (심바스타틴). 중복 제안이다.
      .filter((x) => {
        if (seen.has(x.name)) return false;
        seen.add(x.name);
        return true;
      })
      .slice(0, limit)
      .map(({ id, name, type }) => ({ id, name, type }));
  }

  async getById(id: string, _lang: 'ko' | 'en') {
    const drug = await this.prisma.drug.findUnique({
      where: { id },
      include: { ingredients: true },
    });

    if (!drug) {
      throw new NotFoundException('Drug not found');
    }

    return {
      id: drug.id,
      nameKo: drug.nameKo,
      nameEn: drug.nameEn,
      category: drug.category,
      descriptionKo: drug.descriptionKo,
      descriptionEn: drug.descriptionEn,
      ingredients: drug.ingredients.map((i) => ({
        id: i.id,
        nameKo: i.nameKo,
        nameEn: i.nameEn,
      })),
      createdAt: drug.createdAt.toISOString(),
    };
  }
}
