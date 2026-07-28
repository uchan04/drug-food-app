'use client';

import { useState, useCallback, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim()) onSearch(value.trim());
    },
    [value, onSearch],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (e.target.value.trim().length >= 2) {
        const timeout = setTimeout(() => onSearch(e.target.value.trim()), 300);
        return () => clearTimeout(timeout);
      }
      if (e.target.value.trim().length === 0) onSearch('');
    },
    [onSearch],
  );

  return (
    <form onSubmit={handleSubmit} data-testid="search-form">
      <div className="border-b border-white/20 pb-4 flex items-center gap-4">
        <span className="text-white/30 text-sm font-medium tracking-wider">SEARCH</span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="약물명 또는 성분명 입력"
          className="flex-1 bg-transparent text-white text-2xl font-semibold placeholder-white/20 outline-none"
          data-testid="search-input"
          aria-label="약물 검색"
        />
      </div>
    </form>
  );
}
