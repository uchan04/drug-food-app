import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DrugService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const drugs = await this.prisma.drug.findMany({
      orderBy: [{ category: 'asc' }, { nameKo: 'asc' }],
      select: { id: true, nameKo: true, nameEn: true, category: true },
    });
    return drugs;
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
      SELECT DISTINCT ON (d.id)
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
      ORDER BY d.id, similarity DESC
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
      Math.ceil(limit / 2),
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
      Math.ceil(limit / 2),
    );

    const combined = [
      ...drugs.map((d) => ({ id: d.id, name: d.name, type: 'product' as const })),
      ...ingredients.map((i) => ({ id: i.id, name: i.name, type: 'ingredient' as const })),
    ].slice(0, limit);

    return combined;
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
