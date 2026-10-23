import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { queryKind, transcribe } from './hangul';

@Injectable()
export class DrugService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 초성·영타 질의를 약품명에 맞춘다. 해당 표기가 아니면 빈 배열이다.
   *
   * trigram 은 이것을 못 잡는다 — "ㅌㅇㄹㄴ" 과 "타이레놀" 은 글자를 하나도
   * 공유하지 않아 similarity 가 0 이고, 임계값을 낮춰도 안 잡힌다. 그래서
   * 이름 쪽을 같은 표기로 바꿔서 접두어로 맞춘다.
   *
   * ponytail: 이름을 전부 읽어 메모리에서 거른다. 약 26개·성분 26개라 한 번에
   * 읽는 편이 가장 짧다. 품목이 수만 건이 되면 choseong/qwerty 생성 열 +
   * 인덱스(또는 pg_trgm 을 그 열에)로 옮긴다.
   */
  private async altMatch(query: string, lang: 'ko' | 'en') {
    const kind = lang === 'ko' ? queryKind(query) : null;
    if (!kind) return [];

    const q = query.replace(/\s/g, '').toLowerCase();
    const names = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; type: 'product' | 'ingredient' }>
    >(
      `
      SELECT id, name_ko AS name, 'product' AS type FROM drugs
      UNION ALL
      SELECT drug_id AS id, name_ko AS name, 'ingredient' AS type FROM drug_ingredients
      `,
    );

    return names
      .map((r) => ({ ...r, key: transcribe(r.name, kind) }))
      .filter((r) => r.key.length > 0 && r.key.startsWith(q))
      // 짧은 이름이 먼저다. 질의와 길이가 같은 것(정확히 그 이름)이 1위가 된다.
      .sort((a, b) => a.key.length - b.key.length || a.name.localeCompare(b.name))
      .filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i);
  }

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

    // 초성·영타는 trigram 이 0 점을 주므로 이름 변환으로 따로 맞춘다.
    // 그 표기가 아니면 빈 배열이고 아래 질의는 지금까지와 똑같이 돈다.
    const altIds = (await this.altMatch(sanitizedQuery, lang)).map((r) => r.id);

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
        OR d.id = ANY($4::text[])
      -- DISTINCT ON (d.id) 가 있었다. FROM 절에 JOIN 이 없고 성분 매칭은 상관
      -- 스칼라 서브쿼리라서 약마다 행이 하나뿐이고, 지울 중복이 애초에 없었다.
      -- 그런데 Postgres 는 DISTINCT ON 식을 ORDER BY 맨 앞에 요구하므로
      -- ORDER BY d.id 가 강제되어 관련도 정렬이 깨져 있었다. 결과가 유사도순이
      -- 아니라 약품 ID 순이었다 (아세트아미노펜 검색에 아스피린 d008 이
      -- 타이레놀 d009 보다 먼저 나왔다). 측정값: R@1 0.782 -> 1.000.
      -- d.id 는 동점 처리용이다. 전순서가 없으면 OFFSET 페이징에서 행이
      -- 중복되거나 누락된다.
      -- array_position 은 altMatch 가 매긴 순서다. 빈 배열이면 전부 0 이라
      -- 기존 정렬에 아무 영향이 없다. 초성 질의일 때는 similarity 가 전부 0
      -- 이라 이 열이 사실상 정렬을 맡는다.
      ORDER BY similarity DESC, COALESCE(array_position($4::text[], d.id), 0), d.id
      LIMIT $2 OFFSET $3
      `,
      sanitizedQuery,
      limit,
      offset,
      altIds,
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
        OR d.id = ANY($2::text[])
      `,
      sanitizedQuery,
      altIds,
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

    // 초성·영타면 trigram 쪽은 전부 임계값 미만이라 빈 목록이 된다.
    // 드롭다운은 1위가 전부라서 변환 매칭 결과를 그대로 쓴다.
    const alt = await this.altMatch(sanitizedQuery, lang);
    if (alt.length > 0) {
      return alt.slice(0, limit).map(({ id, name, type }) => ({ id, name, type }));
    }

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
