/**
 * Domain-specific generators for property-based testing (PBT-07)
 * Produces realistic, constrained test data for Drug-Food domain
 */
import * as fc from 'fast-check';

/** Generate a valid RiskLevel */
export const riskLevelArb = fc.constantFrom('caution', 'warning', 'contraindicated') as fc.Arbitrary<'caution' | 'warning' | 'contraindicated'>;

/** Generate a valid language */
export const languageArb = fc.constantFrom('ko', 'en') as fc.Arbitrary<'ko' | 'en'>;

/** Generate a realistic Korean drug name */
export const koreanDrugNameArb = fc.constantFrom(
  '아스피린', '타이레놀', '부루펜', '리피토', '크레스토',
  '독시사이클린', '와파린', '자일로릭', '리시노프릴', '에날라프릴',
);

/** Generate a realistic English drug name */
export const englishDrugNameArb = fc.constantFrom(
  'Aspirin', 'Tylenol', 'Brufen', 'Lipitor', 'Crestor',
  'Doxycycline', 'Warfarin', 'Zyloric', 'Lisinopril', 'Enalapril',
);

/** Generate a valid drug category */
export const drugCategoryArb = fc.constantFrom(
  '고혈압약', '고지혈증약', '항생제', '진통소염제', '통풍약', '항응고제',
);

/** Generate a valid food category */
export const foodCategoryArb = fc.constantFrom(
  '과일', '유제품', '채소', '음료', '기타',
);

/** Generate a valid time gap (null or 1-72 hours) */
export const timeGapArb = fc.option(
  fc.integer({ min: 1, max: 72 }),
  { nil: null },
);

/** Generate a valid search query (1-100 chars, Korean or English) */
export const searchQueryArb = fc.oneof(
  fc.stringOf(fc.constantFrom('아', '스', '피', '린', '타', '이', '레', '놀', '부', '루', '펜'), { minLength: 1, maxLength: 10 }),
  fc.stringOf(fc.constantFrom('a', 's', 'p', 'i', 'r', 'n', 't', 'y', 'l', 'e'), { minLength: 1, maxLength: 10 }),
);

/** Generate an interaction report with realistic constraints */
export const interactionReportArb = fc.record({
  riskLevel: riskLevelArb,
  timeGapHours: timeGapArb,
  reasonLength: fc.integer({ min: 10, max: 500 }),
});
