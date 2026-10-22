'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { drugApi, medicineBoxApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { DrugInteractions } from './drug-interactions';

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [addedDrugs, setAddedDrugs] = useState<Set<string>>(new Set());
  // 펼친 약. 로그인 없이도 상호작용과 출처를 볼 수 있어야 한다.
  const [openDrug, setOpenDrug] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['drugSearch', query],
    queryFn: () => drugApi.search(query),
    enabled: query.length >= 1,
  });

  const addToBox = useMutation({
    mutationFn: (drugId: string) => medicineBoxApi.addItem(drugId, token!),
    onSuccess: (_data, drugId) => {
      setAddedDrugs((prev) => new Set(prev).add(drugId));
      queryClient.invalidateQueries({ queryKey: ['medicineBox'] });
    },
    onError: (err, drugId) => {
      if (err instanceof Error && err.message.includes('already')) {
        setAddedDrugs((prev) => new Set(prev).add(drugId));
      }
    },
  });

  if (isLoading) return <p className="text-white/30 text-sm" data-testid="search-loading">Searching...</p>;
  if (error) return <p className="text-red-400 text-sm" data-testid="search-error">오류가 발생했습니다</p>;

  const results = (data as { data: Array<{ id: string; productName: string; category: string; hasInteractions: boolean }> })?.data;
  if (!results || results.length === 0) return <p className="text-white/30 text-sm" data-testid="search-no-results">결과 없음</p>;

  return (
    <div data-testid="search-results">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-white/40">RESULTS</span>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[11px] font-medium text-white/30">{results.length}</span>
      </div>

      <div className="space-y-0 border border-white/10 rounded-2xl overflow-hidden">
        {results.map((drug, idx) => (
          <div key={drug.id} className={idx > 0 ? 'border-t border-white/5' : ''}>
          <div
            className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.03] transition-colors"
            data-testid={`search-result-${drug.id}`}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-[11px] text-white/20 font-mono">{String(idx + 1).padStart(2, '0')}</span>
              <div>
                <p className="text-white font-semibold">{drug.productName}</p>
                <p className="text-[12px] text-white/40 mt-0.5">{drug.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {drug.hasInteractions && (
                <button
                  type="button"
                  onClick={() => setOpenDrug(openDrug === drug.id ? null : drug.id)}
                  className="text-[11px] px-2.5 py-1 bg-orange-900/30 text-orange-400 rounded-full border border-orange-700/30 hover:bg-orange-900/50 transition-colors"
                  data-testid={`toggle-interactions-${drug.id}`}
                  aria-expanded={openDrug === drug.id}
                >
                  상호작용 {openDrug === drug.id ? '닫기' : '보기'}
                </button>
              )}
              <button
                className={`text-[12px] font-semibold px-4 py-2 rounded-full border transition-all ${
                  addedDrugs.has(drug.id)
                    ? 'border-accent/50 text-accent'
                    : 'border-white/20 text-white/70 hover:border-accent/50 hover:text-accent'
                }`}
                data-testid={`add-to-box-${drug.id}`}
                disabled={!token || addedDrugs.has(drug.id)}
                onClick={() => addToBox.mutate(drug.id)}
              >
                {addedDrugs.has(drug.id) ? 'SAVED' : 'SAVE'}
              </button>
            </div>
          </div>
          {openDrug === drug.id && <DrugInteractions drugId={drug.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
