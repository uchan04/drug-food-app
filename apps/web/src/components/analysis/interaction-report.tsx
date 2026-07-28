'use client';

import { useState } from 'react';
import { RiskBadge } from './risk-badge';

interface Interaction {
  id: string;
  food: { nameKo: string; nameEn: string; category: string };
  riskLevel: 'caution' | 'warning' | 'contraindicated';
  reason: string;
  sideEffects: string;
  timeGapHours: number | null;
  drugName?: string;
}

interface InteractionReportProps {
  interactions: Interaction[];
  summary: { caution: number; warning: number; contraindicated: number; total: number };
}

type RiskFilter = 'all' | 'caution' | 'warning' | 'contraindicated';

export function InteractionReport({ interactions, summary }: InteractionReportProps) {
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('all');

  if (interactions.length === 0) {
    return (
      <div className="border border-white/10 rounded-2xl p-12 text-center" data-testid="no-interactions">
        <p className="text-accent font-semibold">상호작용이 발견되지 않았습니다</p>
        <p className="text-white/40 text-sm mt-2">현재 약상자의 약물은 일반 음식과의 주요 상호작용이 없습니다</p>
      </div>
    );
  }

  const filtered = activeFilter === 'all' ? interactions : interactions.filter((i) => i.riskLevel === activeFilter);

  const tabs: { key: RiskFilter; label: string; count: number }[] = [
    { key: 'all', label: 'ALL', count: summary.total },
    { key: 'caution', label: 'CAUTION', count: summary.caution },
    { key: 'warning', label: 'WARNING', count: summary.warning },
    { key: 'contraindicated', label: 'CRITICAL', count: summary.contraindicated },
  ];

  return (
    <div className="space-y-8" data-testid="interaction-report">
      {/* Tabs */}
      <div className="flex gap-3" data-testid="interaction-filters">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveFilter(t.key)}
            className={`text-[12px] font-semibold px-4 py-2 rounded-full border transition-all ${
              activeFilter === t.key
                ? 'bg-white text-black border-white'
                : 'border-white/15 text-white/50 hover:text-white hover:border-white/40'
            }`}
            data-testid={`filter-${t.key}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-white/30 text-sm py-8 text-center">해당 등급의 상호작용이 없습니다</p>
      ) : (
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          {filtered.map((item, idx) => (
            <div key={item.id} className={`px-6 py-6 hover:bg-white/[0.02] ${idx > 0 ? 'border-t border-white/5' : ''}`} data-testid={`interaction-item-${item.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{item.food.nameKo}</p>
                  {item.drugName && <p className="text-[12px] text-white/40 mt-0.5">{item.drugName}</p>}
                </div>
                <RiskBadge level={item.riskLevel} />
              </div>
              <div className="space-y-2 text-[13px]">
                <p className="text-white/50"><span className="text-white/30">원리 — </span>{item.reason}</p>
                <p className="text-white/50"><span className="text-white/30">부작용 — </span>{item.sideEffects}</p>
                {item.timeGapHours && (
                  <p className="text-accent/80 text-[12px]">권장 시간 간격: {item.timeGapHours}시간</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
