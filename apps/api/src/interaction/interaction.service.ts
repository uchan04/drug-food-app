import { Injectable, NotFoundException } from '@nestjs/common';

import { MedicineBoxService } from '../medicine-box/medicine-box.service';
import { PrismaService } from '../prisma/prisma.service';

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
      id: interaction.id,
      food: {
        id: interaction.food.id,
        nameKo: interaction.food.nameKo,
        nameEn: interaction.food.nameEn,
        category: interaction.food.category,
        nutrients: interaction.food.nutrients,
      },
      riskLevel: interaction.riskLevel,
      // 추출한 행은 영문이 없다. null 을 내려주면 영어 사용자에게 설명이
      // 사라지므로 한국어 원문으로 대체한다. 없는 것보다 낫다.
      reason: lang === 'ko' ? interaction.reasonKo : interaction.reasonEn ?? interaction.reasonKo,
      sideEffects: lang === 'ko' ? interaction.sideEffectsKo : interaction.sideEffectsEn ?? interaction.sideEffectsKo,
      timeGapHours: interaction.timeGapHours,
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

    const mappedInteractions = interactions.map((interaction) => ({
      id: interaction.id,
      food: {
        id: interaction.food.id,
        nameKo: interaction.food.nameKo,
        nameEn: interaction.food.nameEn,
        category: interaction.food.category,
        nutrients: interaction.food.nutrients,
      },
      riskLevel: interaction.riskLevel,
      // 추출한 행은 영문이 없다. null 을 내려주면 영어 사용자에게 설명이
      // 사라지므로 한국어 원문으로 대체한다. 없는 것보다 낫다.
      reason: lang === 'ko' ? interaction.reasonKo : interaction.reasonEn ?? interaction.reasonKo,
      sideEffects: lang === 'ko' ? interaction.sideEffectsKo : interaction.sideEffectsEn ?? interaction.sideEffectsKo,
      timeGapHours: interaction.timeGapHours,
    }));

    // Sort by risk priority
    const riskPriority = { contraindicated: 3, warning: 2, caution: 1 };
    mappedInteractions.sort(
      (a, b) => riskPriority[b.riskLevel] - riskPriority[a.riskLevel],
    );

    return mappedInteractions;
  }
}
