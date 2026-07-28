'use client';

import { useEffect, useState, useCallback } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  const refreshToken = useCallback(() => {
    const stored = localStorage.getItem('accessToken');
    setToken(stored);
  }, []);

  useEffect(() => {
    refreshToken();

    // 다른 탭에서 로그인/로그아웃 시 동기화
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        setToken(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshToken]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setToken(null);
    window.location.href = '/auth/login';
  };

  return { token, isLoggedIn: !!token, logout, refreshToken };
}
