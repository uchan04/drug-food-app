'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Drug {
  id: string;
  nameKo: string;
  nameEn: string;
  category: string;
  interactionCount: number;
}

interface Stats {
  drugs: number;
  foods: number;
  interactions: number;
  sourced: number;
  unsourced: number;
}

async function fetchAllDrugs(): Promise<Drug[]> {
  const res = await fetch(`${API_BASE_URL}/api/drugs/all`);
  if (!res.ok) throw new Error('Failed to fetch drugs');
  return res.json();
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE_URL}/api/interactions/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

interface DrugCatalogProps {
  onSelectDrug: (name: string) => void;
}

export function DrugCatalog({ onSelectDrug }: DrugCatalogProps) {
  const { data: drugs, isLoading } = useQuery<Drug[]>({
    queryKey: ['allDrugs'],
    queryFn: fetchAllDrugs,
  });
  // 약 목록만 보여주면 "26 items" 로 끝난다. 실제로 들어 있는 것은 상호작용
  // 118행이고 그중 76행에 식약처 출처가 붙어 있다. 그게 이 데이터베이스의 내용이다.
  const { data: stats } = useQuery<Stats>({ queryKey: ['dbStats'], queryFn: fetchStats });

  if (isLoading) {
    return <p className="text-white/30 text-sm">Loading...</p>;
  }

  if (!drugs || drugs.length === 0) return null;

  const grouped: Record<string, Drug[]> = {};
  for (const drug of drugs) {
    const list = grouped[drug.category];
    if (list) list.push(drug);
    else grouped[drug.category] = [drug];
  }

  return (
    <div className="space-y-0" data-testid="drug-catalog">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-white/40">DATABASE</span>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[11px] font-medium text-white/30">약 {drugs.length}종</span>
      </div>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/5 sm:grid-cols-4"
             data-testid="db-stats">
          {[
            { label: '약', value: stats.drugs, sub: '종' },
            { label: '음식·성분', value: stats.foods, sub: '종' },
            { label: '상호작용', value: stats.interactions, sub: '행' },
            { label: '식약처 출처 있음', value: stats.sourced, sub: `/ ${stats.interactions}행`, accent: true },
          ].map((s) => (
            <div key={s.label} className="bg-surface px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{s.label}</p>
              <p className="mt-1.5">
                <span className={`text-2xl font-bold ${s.accent ? 'text-accent' : 'text-white'}`}>{s.value}</span>
                <span className="ml-1 text-[11px] text-white/30">{s.sub}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
        {Object.entries(grouped).map(([category, categoryDrugs]) => (
          <div
            key={category}
            className="bg-surface p-6 hover:bg-surface-light transition-colors group"
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] text-accent/70 uppercase mb-4">
              {category}
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryDrugs.map((drug) => (
                <button
                  key={drug.id}
                  onClick={() => onSelectDrug(drug.nameKo)}
                  className="group/chip flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white/60 border border-white/10 rounded-full hover:border-accent/50 hover:text-accent transition-all"
                  title={`${drug.nameEn} — 상호작용 ${drug.interactionCount}건`}
                >
                  {drug.nameKo}
                  {drug.interactionCount > 0 && (
                    <span className="rounded-full bg-white/10 px-1.5 text-[10px] font-mono text-white/40 group-hover/chip:text-accent/70">
                      {drug.interactionCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
