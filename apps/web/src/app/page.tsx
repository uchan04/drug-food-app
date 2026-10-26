'use client';

import { SearchBar } from '@/components/search/search-bar';
import { SearchResults } from '@/components/search/search-results';
import { DrugCatalog } from '@/components/search/drug-catalog';
import { Measurements } from '@/components/home/measurements';
import { useState } from 'react';

const tabs = [
  { id: 'search', label: 'SEARCH' },
  { id: 'upload', label: 'UPLOAD' },
  { id: 'howto', label: 'HOW TO USE' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="pt-[72px]" data-testid="home-page">
      {/* Hero */}
      <section className="max-w-[1400px] mx-auto px-6 pt-20 pb-16">
        <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-black leading-[0.95] tracking-tight">
          MEDICINE<span className="text-accent">—</span>FOOD
          <br />
          INTERACTION CHECKER
        </h1>
        <p className="text-white/50 text-lg mt-6 max-w-xl">
          복용 중인 약과 피해야 할 음식의 상호작용을 확인하세요.
          안전한 식습관을 위한 전문 데이터베이스.
        </p>
      </section>

      {/* 측정값. 데이터가 어디서 왔고 얼마나 맞는지를 검색창보다 먼저 보여준다. */}
      <section className="max-w-[1400px] mx-auto px-6 pb-12">
        <Measurements />
      </section>

      {/* Tabs */}
      <section className="max-w-[1400px] mx-auto px-6 pb-10">
        <div className="flex flex-wrap gap-3 rounded-full bg-white/5 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-accent text-black shadow-lg shadow-accent/20'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'search' ? (
        <>
          {/* Search */}
          <section className="max-w-[1400px] mx-auto px-6 pb-12">
            <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
          </section>

          {/* Content */}
          <section className="max-w-[1400px] mx-auto px-6 pb-20">
            {searchQuery ? (
              <SearchResults query={searchQuery} />
            ) : (
              <DrugCatalog onSelectDrug={(name) => setSearchQuery(name)} />
            )}
          </section>
        </>
      ) : activeTab === 'upload' ? (
        <section className="max-w-[1400px] mx-auto px-6 pb-20">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-black/10 backdrop-blur-xl">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent/80">PRESCRIPTION UPLOAD</p>
              <h2 className="mt-4 text-2xl font-bold text-white">처방전 파일 업로드 (데모)</h2>
              <p className="mt-3 text-white/60 max-w-2xl">
                처방전 파일을 업로드하면 데모 버전에서는 자리만 만들어드립니다. 실제 약물 자동 추가 기능은 추후 구현 예정입니다.
              </p>
            </div>
            <label className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-slate-950/70 p-10 text-center text-white/50 transition hover:border-accent hover:text-white">
              <span className="mb-4 text-sm font-semibold text-white/80">파일을 드래그하거나 클릭하여 업로드하세요</span>
              <input type="file" className="hidden" disabled aria-disabled="true" />
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">데모 버전</span>
            </label>
          </div>
        </section>
      ) : (
        <section className="max-w-[1400px] mx-auto px-6 pb-20">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-black/10 backdrop-blur-xl">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent/80">HOW TO USE</p>
              <h2 className="mt-4 text-3xl font-bold text-white">간단한 3단계로 약-음식 상호작용 확인</h2>
              <p className="mt-3 text-white/60 max-w-2xl mx-auto">
                약물 검색부터 내 약상자 저장, 상호작용 분석까지 한 번에 확인하세요.
              </p>
              <p className="mt-3 text-white/60 max-w-2xl mx-auto">
                UPLOAD 탭에서는 처방전 파일 업로드 자리만 데모로 제공합니다. 실제 약물 자동 추가 기능은 추후 지원될 예정입니다.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/40">STEP 1</p>
                <h3 className="text-xl font-semibold text-white">약물 검색</h3>
                <p className="mt-3 text-white/60">
                  제품명 또는 성분명을 입력해 약물을 검색합니다. 검색 결과에서 관련 약물을 빠르게 찾을 수 있습니다.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/40">STEP 2</p>
                <h3 className="text-xl font-semibold text-white">상호작용 확인</h3>
                <p className="mt-3 text-white/60">
                  검색된 약물에 대해 주의, 경고, 금기 단계로 분류된 음식 상호작용을 확인합니다.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/40">STEP 3</p>
                <h3 className="text-xl font-semibold text-white">내 약상자 저장</h3>
                <p className="mt-3 text-white/60">
                  자주 복용하는 약물을 내 약상자에 저장해 두면 다음에 빠르게 분석하고 관리할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-accent/80">SAFE USE</p>
                <h3 className="text-2xl font-semibold text-white">의료 정보 보조 도구</h3>
                <p className="mt-3 text-white/60">
                  이 서비스는 참고용입니다. 최종 복용 판단과 처방은 반드시 의사 또는 약사와 상담해 주세요.
                  검색 결과는 최신 데이터를 기반으로 제공되지만, 실제 복용 전에는 전문가 의견을 확인하는 것이 안전합니다.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-accent/80">FAQ</p>
                <div className="space-y-5 text-white/60">
                  <div>
                    <p className="font-semibold text-white">검색 결과가 없어요</p>
                    <p className="mt-2 text-sm text-white/60">
                      약 이름이 명확하지 않거나 데이터베이스에 없는 경우일 수 있습니다. 다른 이름이나 성분명으로 다시 검색해 보세요.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">약과 음식 모두 입력해야 하나요?</p>
                    <p className="mt-2 text-sm text-white/60">
                      약을 먼저 검색한 뒤, 관련 음식 상호작용을 확인하는 방식이 기본입니다. 필요하면 자주 먹는 음식도 함께 검토하세요.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">음식만 선택하면 되나요?</p>
                    <p className="mt-2 text-sm text-white/60">
                      음식 정보만으로도 일부 상호작용을 확인할 수 있지만, 약물 이름을 함께 입력하면 더 정확한 분석을 받을 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
