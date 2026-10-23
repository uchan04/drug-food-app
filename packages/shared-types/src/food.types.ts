/**
 * Food-related types
 */

import type { BaseEntity } from './common.types';

/** Food item */
export interface FoodItem {
  id: string;
  nameKo: string;
  nameEn: string;
  category: string;
  nutrients: string[];
  /** 범주 음식의 대표 식품 ("비타민K" -> 시금치, 케일...). 개별 음식은 빈 배열. */
  examples: string[];
}

/** Food detail (full info) */
export interface FoodDetail extends BaseEntity {
  nameKo: string;
  nameEn: string;
  category: string;
  nutrients: string[];
}
