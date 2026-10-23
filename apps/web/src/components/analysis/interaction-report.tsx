'use client';

import { useState } from 'react';
import { RiskBadge } from './risk-badge';

export interface Interaction {
  id: string;
  food: { nameKo: string; nameEn: string; category: string; examples: string[] };
  riskLevel: 'caution' | 'warning' | 'contraindicated';
  reason: string;
  sideEffects: string | null;
  timeGapHours: number | null;
  drugName?: string;
  source: string;
  sourceUrl: string | null;
}

// 'mfds:permit:200410085' -> '200410085'. 그 외(seed:manual)는 null.
function itemSeq(source: string) {
  const m = /^mfds:permit:(\d+)$/.exec(source);
  return m ? m[1] : null;
}

// 식약처 의약품통합정보시스템의 품목 상세 페이지. 사람이 읽을 수 있는 원문이다.
// DB 의 sourceUrl 은 데이터를 받은 API 엔드포인트라서 클릭해도 쓸모가 없다.
// ponytail: URL 형태를 코드에 적어 뒀다. 바뀌면 링크만 죽고 출처 표기는 남는다.
const MFDS_ITEM = 'https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=';

/**
 * 범주 음식의 대표 식품. 허가사항은 "비타민 K, 지방, 야채류 섭취"처럼 범주로
 * 쓰는데 사용자는 시금치를 먹을지를 묻는다. 개별 음식은 빈 배열이라 안 찍힌다.
 */
export function FoodExamples({ examples }: { examples: string[] }) {
  if (examples.length === 0) return null;
  return (
    <p className="text-[11.5px] text-white/30" data-testid="food-examples">
      예: {examples.join(' · ')}
    </p>
  );
}

export function SourceLine({ source }: { source: string }) {
  const seq = itemSeq(source);
  if (!seq) {
    return (
      <p className="text-[12px] text-white/25" data-testid="source-manual">
        출처 미확인 — 직접 입력한 항목입니다
      </p>
    );
  }
  return (
    <p className="text-[12px] text-white/30" data-testid="source-mfds">
      출처{' '}
      <a
        href={`${MFDS_ITEM}${seq}`}
        target="_blank"
        rel="noreferrer noopener"
        className="text-accent/70 underline decoration-accent/30 hover:text-accent"
      >
        식약처 의약품 허가정보
      </a>{' '}
      <span className="font-mono text-white/25">품목기준코드 {seq}</span>
    </p>
  );
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
                  <FoodExamples examples={item.food.examples} />
                  {item.drugName && <p className="text-[12px] text-white/40 mt-0.5">{item.drugName}</p>}
                </div>
                <RiskBadge level={item.riskLevel} />
              </div>
              <div className="space-y-2 text-[13px]">
                <p className="text-white/50"><span className="text-white/30">원리 — </span>{item.reason}</p>
                {/* 식약처에서 추출한 행에는 부작용이 없다. 빈 "부작용 — " 를 찍지 않는다. */}
                {item.sideEffects && (
                  <p className="text-white/50"><span className="text-white/30">부작용 — </span>{item.sideEffects}</p>
                )}
                {item.timeGapHours && (
                  <p className="text-accent/80 text-[12px]">권장 시간 간격: {item.timeGapHours}시간</p>
                )}
                <SourceLine source={item.source} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
