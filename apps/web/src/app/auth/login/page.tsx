'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password) as { accessToken: string; refreshToken: string };
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-[72px] min-h-screen flex items-center justify-center px-6" data-testid="login-page">
      <div className="w-full max-w-sm space-y-8">
        <h1 className="text-3xl font-black tracking-tight text-center">LOGIN</h1>
        <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
          {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3" data-testid="login-error">{error}</p>}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="이메일" autoComplete="email"
            className="w-full px-0 py-4 bg-transparent border-b border-white/20 text-white placeholder-white/30 outline-none focus:border-accent transition-colors" data-testid="login-email-input" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="비밀번호" autoComplete="current-password"
            className="w-full px-0 py-4 bg-transparent border-b border-white/20 text-white placeholder-white/30 outline-none focus:border-accent transition-colors" data-testid="login-password-input" />
          <button type="submit" disabled={isLoading}
            className="w-full py-4 bg-accent text-black font-bold rounded-full hover:bg-accent-dim transition-colors disabled:opacity-50 text-[14px] tracking-wider" data-testid="login-submit-button">
            {isLoading ? 'LOADING...' : 'LOGIN'}
          </button>
        </form>
        <p className="text-center text-sm text-white/40">
          계정이 없으신가요? <Link href="/auth/register" className="text-white hover:text-accent transition-colors font-medium" data-testid="register-link">REGISTER</Link>
        </p>
      </div>
    </div>
  );
}
