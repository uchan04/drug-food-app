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
}

/** Food detail (full info) */
export interface FoodDetail extends BaseEntity {
  nameKo: string;
  nameEn: string;
  category: string;
  nutrients: string[];
}
