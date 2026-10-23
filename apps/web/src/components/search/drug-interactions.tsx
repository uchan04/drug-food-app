'use client';

import { useQuery } from '@tanstack/react-query';

import { FoodExamples, SourceLine } from '@/components/analysis/interaction-report';
import type { Interaction } from '@/components/analysis/interaction-report';
import { RiskBadge } from '@/components/analysis/risk-badge';
import { interactionApi } from '@/lib/api-client';

/**
 * 검색 결과에서 바로 펼쳐 보는 상호작용 목록.
 *
 * interactionApi.analyzeDrug 는 전부터 있었는데 호출하는 곳이 없었다. 상호작용을
 * 보려면 로그인하고 약상자에 넣어야 했고, 그래서 식약처 출처가 붙은 76행이
 * 검색만으로는 보이지 않았다.
 */
export function DrugInteractions({ drugId }: { drugId: string }) {
  const { data, isLoading, error } = useQuery<Interaction[]>({
    queryKey: ['drugInteractions', drugId],
    queryFn: () => interactionApi.analyzeDrug(drugId) as Promise<Interaction[]>,
  });

  if (isLoading) return <p className="px-6 pb-5 text-[12px] text-white/30">불러오는 중...</p>;
  if (error) return <p className="px-6 pb-5 text-[12px] text-red-400">상호작용을 불러오지 못했습니다</p>;
  if (!data || data.length === 0) {
    return <p className="px-6 pb-5 text-[12px] text-white/30">등록된 상호작용이 없습니다</p>;
  }

  const sourced = data.filter((i) => i.source !== 'seed:manual').length;

  return (
    <div className="px-6 pb-6" data-testid={`drug-interactions-${drugId}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[10px] font-semibold tracking-[0.15em] text-white/35">INTERACTIONS</span>
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] text-white/30">
          {data.length}건 · 출처 있음 <span className="text-accent/70">{sourced}</span>
        </span>
      </div>

      <div className="divide-y divide-white/5 rounded-xl border border-white/10">
        {data.map((item) => (
          <div key={item.id} className="px-4 py-3.5" data-testid={`si-${item.id}`}>
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-white">{item.food.nameKo}</p>
                <FoodExamples examples={item.food.examples} />
              </div>
              <RiskBadge level={item.riskLevel} />
            </div>
            <p className="text-[12.5px] leading-relaxed text-white/50">{item.reason}</p>
            {item.timeGapHours && (
              <p className="mt-1 text-[11px] text-accent/80">권장 시간 간격: {item.timeGapHours}시간</p>
            )}
            <div className="mt-1.5">
              <SourceLine source={item.source} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
