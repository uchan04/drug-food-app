/**
 * Drug-Food interaction types
 */

import type { BaseEntity, Language } from './common.types';
import type { FoodItem } from './food.types';

/** Risk level for drug-food interactions */
export type RiskLevel = 'caution' | 'warning' | 'contraindicated';

/** Risk level display info */
export const RISK_LEVEL_CONFIG = {
  caution: {
    labelKo: '주의',
    labelEn: 'Caution',
    color: '#FFC107',
    priority: 1,
  },
  warning: {
    labelKo: '경고',
    labelEn: 'Warning',
    color: '#FF9800',
    priority: 2,
  },
  contraindicated: {
    labelKo: '금기',
    labelEn: 'Contraindicated',
    color: '#F44336',
    priority: 3,
  },
} as const;

/** Single drug-food interaction */
export interface DrugInteraction {
  id: string;
  food: FoodItem;
  riskLevel: RiskLevel;
  reason: string; // Localized
  sideEffects: string; // Localized
  timeGapHours: number | null;
}

/** Full interaction report for user's medicine box */
export interface InteractionReport {
  drugs: Array<{
    id: string;
    name: string; // Localized
    category: string;
  }>;
  interactions: DrugInteraction[];
  summary: {
    caution: number;
    warning: number;
    contraindicated: number;
    total: number;
  };
}

/** Interaction detail (DB entity) */
export interface InteractionDetail extends BaseEntity {
  ingredientId: string;
  foodId: string;
  riskLevel: RiskLevel;
  reasonKo: string;
  /** 식약처에서 추출한 행은 한국어 원문만 있다 */
  reasonEn: string | null;
  sideEffectsKo: string | null;
  sideEffectsEn: string | null;
  timeGapHours: number | null;
}

/** Analyze request params */
export interface AnalyzeQuery {
  lang?: Language;
}
