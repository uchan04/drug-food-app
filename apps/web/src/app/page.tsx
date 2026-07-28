'use client';

import { SearchBar } from '@/components/search/search-bar';
import { SearchResults } from '@/components/search/search-results';
import { DrugCatalog } from '@/components/search/drug-catalog';
import { useState } from 'react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

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
    </div>
  );
}
