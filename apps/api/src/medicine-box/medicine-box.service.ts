import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const MAX_MEDICINE_BOX_ITEMS = 20;

@Injectable()
export class MedicineBoxService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserBox(userId: string) {
    const items = await this.prisma.medicineBoxItem.findMany({
      where: { userId },
      include: {
        drug: { select: { id: true, nameKo: true, nameEn: true, category: true } },
      },
      orderBy: { addedAt: 'desc' },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        drugId: item.drug.id,
        drugNameKo: item.drug.nameKo,
        drugNameEn: item.drug.nameEn,
        drugCategory: item.drug.category,
        addedAt: item.addedAt.toISOString(),
      })),
      totalCount: items.length,
      maxCount: MAX_MEDICINE_BOX_ITEMS,
    };
  }

  async addItem(userId: string, drugId: string) {
    if (!drugId) {
      throw new BadRequestException('drugId is required');
    }

    // Check drug exists
    const drug = await this.prisma.drug.findUnique({ where: { id: drugId } });
    if (!drug) {
      throw new NotFoundException('Drug not found');
    }

    // Check max limit
    const currentCount = await this.prisma.medicineBoxItem.count({
      where: { userId },
    });
    if (currentCount >= MAX_MEDICINE_BOX_ITEMS) {
      throw new BadRequestException(
        `Medicine box is full (max ${MAX_MEDICINE_BOX_ITEMS} items)`,
      );
    }

    // Check duplicate
    const existing = await this.prisma.medicineBoxItem.findUnique({
      where: { userId_drugId: { userId, drugId } },
    });
    if (existing) {
      throw new ConflictException('Drug already in medicine box');
    }

    // Add item
    const item = await this.prisma.medicineBoxItem.create({
      data: { userId, drugId },
      include: {
        drug: { select: { id: true, nameKo: true, nameEn: true, category: true } },
      },
    });

    return {
      id: item.id,
      drugId: item.drug.id,
      drugNameKo: item.drug.nameKo,
      drugNameEn: item.drug.nameEn,
      drugCategory: item.drug.category,
      addedAt: item.addedAt.toISOString(),
    };
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.medicineBoxItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Medicine box item not found');
    }

    if (item.userId !== userId) {
      throw new ForbiddenException('Cannot remove another user\'s item');
    }

    await this.prisma.medicineBoxItem.delete({ where: { id: itemId } });
  }
}
