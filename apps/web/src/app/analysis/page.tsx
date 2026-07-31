'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { interactionApi } from '@/lib/api-client';
import { InteractionReport } from '@/components/analysis/interaction-report';
import { useAuth } from '@/hooks/use-auth';

interface AnalysisResult {
  interactions: Array<{
    id: string;
    food: { nameKo: string; nameEn: string; category: string };
    riskLevel: 'caution' | 'warning' | 'contraindicated';
    reason: string;
    sideEffects: string;
    timeGapHours: number | null;
    drugName?: string;
  }>;
  summary: { caution: number; warning: number; contraindicated: number; total: number };
}

export default function AnalysisPage() {
  const { token } = useAuth();
  const { data, isLoading, error } = useQuery<AnalysisResult>({
    queryKey: ['analysis'],
    queryFn: () => interactionApi.analyzeBox(token!) as Promise<AnalysisResult>,
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="pt-[72px] max-w-[1400px] mx-auto px-6 py-16" data-testid="analysis-auth-required">
        <div className="border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/40 mb-6">로그인이 필요합니다</p>
          <Link href="/auth/login" className="text-[12px] font-semibold px-6 py-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
            LOGIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[100px] max-w-[1400px] mx-auto px-6 py-16 space-y-10" data-testid="analysis-page">
      <h1 className="text-4xl font-black tracking-tight">ANALYSIS</h1>
      {isLoading && <p className="text-white/30 text-sm">Analyzing...</p>}
      {error && <p className="text-red-400 text-sm">오류 발생</p>}
      {data && <InteractionReport interactions={data.interactions} summary={data.summary} />}
    </div>
  );
}
