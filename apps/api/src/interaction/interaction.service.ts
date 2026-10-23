import { Injectable, NotFoundException } from '@nestjs/common';

import { MedicineBoxService } from '../medicine-box/medicine-box.service';
import { PrismaService } from '../prisma/prisma.service';

/** Interaction 한 행을 응답 형태로 바꾼다. 두 분석 경로가 같은 모양을 내야 한다. */
function mapInteraction(
  interaction: {
    id: string;
    riskLevel: 'caution' | 'warning' | 'contraindicated';
    reasonKo: string;
    reasonEn: string | null;
    sideEffectsKo: string | null;
    sideEffectsEn: string | null;
    timeGapHours: number | null;
    source: string;
    sourceUrl: string | null;
    food: {
      id: string; nameKo: string; nameEn: string; category: string; nutrients: string[];
      examples: string[];
    };
  },
  lang: 'ko' | 'en',
) {
  return {
    id: interaction.id,
    food: {
      id: interaction.food.id,
      nameKo: interaction.food.nameKo,
      nameEn: interaction.food.nameEn,
      category: interaction.food.category,
      nutrients: interaction.food.nutrients,
      // 범주 음식의 대표 식품. "비타민K" 한 줄이 시금치·케일까지 덮는다.
      examples: interaction.food.examples,
    },
    riskLevel: interaction.riskLevel,
    // 추출한 행은 영문이 없다. null 을 내려주면 영어 사용자에게 설명이
    // 사라지므로 한국어 원문으로 대체한다. 없는 것보다 낫다.
    reason: lang === 'ko' ? interaction.reasonKo : interaction.reasonEn ?? interaction.reasonKo,
    sideEffects:
      lang === 'ko' ? interaction.sideEffectsKo : interaction.sideEffectsEn ?? interaction.sideEffectsKo,
    timeGapHours: interaction.timeGapHours,
    // 출처를 내려주지 않으면 화면에서 근거를 확인할 수 없다. DB 에는 품목기준코드가
    // 들어 있는데 응답에 없어서, 파이프라인이 붙인 출처가 앱에서 보이지 않았다.
    source: interaction.source,
    sourceUrl: interaction.sourceUrl,
  };
}

@Injectable()
export class InteractionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly medicineBoxService: MedicineBoxService,
  ) {}

  async analyzeUserBox(userId: string, lang: 'ko' | 'en') {
    // 1. Get user's medicine box
    const box = await this.medicineBoxService.getUserBox(userId);

    if (box.items.length === 0) {
      return {
        drugs: [],
        interactions: [],
        summary: { caution: 0, warning: 0, contraindicated: 0, total: 0 },
      };
    }

    const drugIds = box.items.map((item) => item.drugId);

    // 2. Get all ingredients for the drugs
    const ingredients = await this.prisma.drugIngredient.findMany({
      where: { drugId: { in: drugIds } },
    });

    const ingredientIds = ingredients.map((i) => i.id);

    // 3. Find all interactions for those ingredients
    const interactions = await this.prisma.interaction.findMany({
      where: { ingredientId: { in: ingredientIds } },
      include: {
        food: true,
        ingredient: {
          include: { drug: true },
        },
      },
      orderBy: { riskLevel: 'desc' },
    });

    // 4. Build report
    const drugs = box.items.map((item) => ({
      id: item.drugId,
      name: lang === 'ko' ? item.drugNameKo : item.drugNameEn,
      category: item.drugCategory,
    }));

    const mappedInteractions = interactions.map((interaction) => ({
      ...mapInteraction(interaction, lang),
      drugName: lang === 'ko'
        ? interaction.ingredient.drug.nameKo
        : interaction.ingredient.drug.nameEn,
    }));

    // 5. Sort by risk priority (contraindicated > warning > caution)
    const riskPriority = { contraindicated: 3, warning: 2, caution: 1 };
    mappedInteractions.sort(
      (a, b) => riskPriority[b.riskLevel] - riskPriority[a.riskLevel],
    );

    // 6. Summary
    const summary = {
      caution: mappedInteractions.filter((i) => i.riskLevel === 'caution').length,
      warning: mappedInteractions.filter((i) => i.riskLevel === 'warning').length,
      contraindicated: mappedInteractions.filter((i) => i.riskLevel === 'contraindicated').length,
      total: mappedInteractions.length,
    };

    return { drugs, interactions: mappedInteractions, summary };
  }

  /** 데이터베이스 규모. 화면에 "무엇이 들어 있는지" 보이기 위한 것이다. */
  async stats() {
    const [drugs, foods, total, sourced, byRisk] = await Promise.all([
      this.prisma.drug.count(),
      this.prisma.food.count(),
      this.prisma.interaction.count(),
      this.prisma.interaction.count({ where: { source: { startsWith: 'mfds:' } } }),
      this.prisma.interaction.groupBy({ by: ['riskLevel'], _count: true }),
    ]);
    const count = (level: string) =>
      byRisk.find((r) => r.riskLevel === level)?._count ?? 0;
    return {
      drugs,
      foods,
      interactions: total,
      sourced,
      unsourced: total - sourced,
      byRisk: {
        caution: count('caution'),
        warning: count('warning'),
        contraindicated: count('contraindicated'),
      },
    };
  }

  async analyzeDrug(drugId: string, lang: 'ko' | 'en') {
    // Verify drug exists
    const drug = await this.prisma.drug.findUnique({
      where: { id: drugId },
      include: { ingredients: true },
    });

    if (!drug) {
      throw new NotFoundException('Drug not found');
    }

    const ingredientIds = drug.ingredients.map((i) => i.id);

    // Find interactions
    const interactions = await this.prisma.interaction.findMany({
      where: { ingredientId: { in: ingredientIds } },
      include: { food: true },
      orderBy: { riskLevel: 'desc' },
    });

    const mappedInteractions = interactions.map((i) => mapInteraction(i, lang));

    // Sort by risk priority
    const riskPriority = { contraindicated: 3, warning: 2, caution: 1 };
    mappedInteractions.sort(
      (a, b) => riskPriority[b.riskLevel] - riskPriority[a.riskLevel],
    );

    return mappedInteractions;
  }
}
