'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Drug {
  id: string;
  nameKo: string;
  nameEn: string;
  category: string;
}

async function fetchAllDrugs(): Promise<Drug[]> {
  const res = await fetch(`${API_BASE_URL}/api/drugs/all`);
  if (!res.ok) throw new Error('Failed to fetch drugs');
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
      <div className="flex items-center gap-3 mb-8">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-white/40">DATABASE</span>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[11px] font-medium text-white/30">{drugs.length} items</span>
      </div>

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
                  className="px-3 py-1.5 text-[13px] text-white/60 border border-white/10 rounded-full hover:border-accent/50 hover:text-accent transition-all"
                  title={drug.nameEn}
                >
                  {drug.nameKo}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
