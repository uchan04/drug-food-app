'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { medicineBoxApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

export function MedicineBoxList() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['medicineBox'],
    queryFn: () => medicineBoxApi.get(token!),
    enabled: !!token,
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => medicineBoxApi.removeItem(itemId, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medicineBox'] }),
  });

  if (!token) {
    return (
      <div className="border border-white/10 rounded-2xl p-12 text-center" data-testid="medicine-box-auth-required">
        <p className="text-white/40 mb-6">로그인이 필요합니다</p>
        <Link href="/auth/login" className="text-[12px] font-semibold px-6 py-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all" data-testid="medicine-box-login-link">
          LOGIN
        </Link>
      </div>
    );
  }

  if (isLoading) return <p className="text-white/30 text-sm">Loading...</p>;
  if (error) return <p className="text-red-400 text-sm">오류 발생</p>;

  const box = data as { items: Array<{ id: string; drugNameKo: string; drugCategory: string; addedAt: string }>; totalCount: number; maxCount: number };

  if (!box || box.items.length === 0) {
    return (
      <div className="border border-white/10 rounded-2xl p-12 text-center" data-testid="medicine-box-empty">
        <p className="text-white/40 mb-6">약상자가 비어 있습니다</p>
        <Link href="/" className="text-[12px] font-semibold px-6 py-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
          SEARCH DRUGS
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="medicine-box-list">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-white/40">
          {box.totalCount} / {box.maxCount} ITEMS
        </span>
        <Link href="/analysis" className="text-[12px] font-semibold px-5 py-2.5 bg-accent text-black rounded-full hover:bg-accent-dim transition-colors" data-testid="analyze-button">
          ANALYZE
        </Link>
      </div>

      <div className="border border-white/10 rounded-2xl overflow-hidden">
        {box.items.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center justify-between px-6 py-5 hover:bg-white/[0.03] transition-colors ${
              idx > 0 ? 'border-t border-white/5' : ''
            }`}
            data-testid={`medicine-box-item-${item.id}`}
          >
            <div className="flex items-baseline gap-4">
              <span className="text-[11px] text-white/20 font-mono">{String(idx + 1).padStart(2, '0')}</span>
              <div>
                <p className="text-white font-semibold">{item.drugNameKo}</p>
                <p className="text-[12px] text-white/40">{item.drugCategory}</p>
              </div>
            </div>
            <button
              className="text-[12px] font-semibold text-white/40 hover:text-red-400 transition-colors"
              data-testid={`remove-item-${item.id}`}
              onClick={() => removeItem.mutate(item.id)}
            >
              REMOVE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
