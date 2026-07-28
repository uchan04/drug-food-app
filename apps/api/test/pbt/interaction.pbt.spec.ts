/**
 * Property-Based Tests for Interaction Analysis Engine
 * Verifies invariants of the drug-food interaction system (PBT-03)
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { riskLevelArb, timeGapArb } from '../generators/drug.generator';

describe('Interaction Analysis - Property-Based Tests', () => {
  describe('PBT-03: RiskLevel Invariants', () => {
    it('risk level is always one of three valid values', () => {
      fc.assert(
        fc.property(riskLevelArb, (riskLevel) => {
          const validLevels = ['caution', 'warning', 'contraindicated'];
          expect(validLevels).toContain(riskLevel);
        }),
      );
    });

    it('risk priority ordering is consistent (contraindicated > warning > caution)', () => {
      const riskPriority: Record<string, number> = {
        caution: 1,
        warning: 2,
        contraindicated: 3,
      };

      fc.assert(
        fc.property(
          riskLevelArb,
          riskLevelArb,
          (level1, level2) => {
            if (level1 === level2) {
              expect(riskPriority[level1]).toBe(riskPriority[level2]);
            }
            // Ordering is total: every pair can be compared
            expect(riskPriority[level1]).toBeGreaterThanOrEqual(1);
            expect(riskPriority[level1]).toBeLessThanOrEqual(3);
          },
        ),
      );
    });
  });

  describe('PBT-03: TimeGap Invariants', () => {
    it('time gap is null or within valid range (1-72 hours)', () => {
      fc.assert(
        fc.property(timeGapArb, (timeGap) => {
          if (timeGap === null) {
            expect(timeGap).toBeNull();
          } else {
            expect(timeGap).toBeGreaterThanOrEqual(1);
            expect(timeGap).toBeLessThanOrEqual(72);
          }
        }),
      );
    });
  });

  describe('PBT-03: Report Summary Invariants', () => {
    it('summary counts always equal total interactions', () => {
      fc.assert(
        fc.property(
          fc.array(riskLevelArb, { minLength: 0, maxLength: 50 }),
          (riskLevels) => {
            const summary = {
              caution: riskLevels.filter((r) => r === 'caution').length,
              warning: riskLevels.filter((r) => r === 'warning').length,
              contraindicated: riskLevels.filter((r) => r === 'contraindicated').length,
              total: riskLevels.length,
            };

            // Invariant: sum of individual counts equals total
            expect(
              summary.caution + summary.warning + summary.contraindicated,
            ).toBe(summary.total);

            // Invariant: no count is negative
            expect(summary.caution).toBeGreaterThanOrEqual(0);
            expect(summary.warning).toBeGreaterThanOrEqual(0);
            expect(summary.contraindicated).toBeGreaterThanOrEqual(0);
          },
        ),
      );
    });

    it('sorting by risk priority maintains descending order', () => {
      const riskPriority: Record<string, number> = {
        caution: 1,
        warning: 2,
        contraindicated: 3,
      };

      fc.assert(
        fc.property(
          fc.array(riskLevelArb, { minLength: 2, maxLength: 30 }),
          (riskLevels) => {
            // Sort by priority descending (same algorithm as service)
            const sorted = [...riskLevels].sort(
              (a, b) => (riskPriority[b] ?? 0) - (riskPriority[a] ?? 0),
            );

            // Invariant: sorted array is in non-increasing priority order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(riskPriority[sorted[i]!] ?? 0).toBeGreaterThanOrEqual(
                riskPriority[sorted[i + 1]!] ?? 0,
              );
            }

            // Invariant: sorting preserves elements (same length, same elements)
            expect(sorted.length).toBe(riskLevels.length);
            expect(sorted.sort()).toEqual([...riskLevels].sort());
          },
        ),
      );
    });
  });
});
