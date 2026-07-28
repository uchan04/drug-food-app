'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.register(email, password, name);
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-[72px] min-h-screen flex items-center justify-center px-6" data-testid="register-page">
      <div className="w-full max-w-sm space-y-8">
        <h1 className="text-3xl font-black tracking-tight text-center">REGISTER</h1>
        <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
          {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3" data-testid="register-error">{error}</p>}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="이름" autoComplete="name"
            className="w-full px-0 py-4 bg-transparent border-b border-white/20 text-white placeholder-white/30 outline-none focus:border-accent transition-colors" data-testid="register-name-input" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="이메일" autoComplete="email"
            className="w-full px-0 py-4 bg-transparent border-b border-white/20 text-white placeholder-white/30 outline-none focus:border-accent transition-colors" data-testid="register-email-input" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="비밀번호 (8자 이상)" autoComplete="new-password"
            className="w-full px-0 py-4 bg-transparent border-b border-white/20 text-white placeholder-white/30 outline-none focus:border-accent transition-colors" data-testid="register-password-input" />
          <button type="submit" disabled={isLoading}
            className="w-full py-4 bg-accent text-black font-bold rounded-full hover:bg-accent-dim transition-colors disabled:opacity-50 text-[14px] tracking-wider" data-testid="register-submit-button">
            {isLoading ? 'LOADING...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p className="text-center text-sm text-white/40">
          이미 계정이 있으신가요? <Link href="/auth/login" className="text-white hover:text-accent transition-colors font-medium" data-testid="login-link">LOGIN</Link>
        </p>
      </div>
    </div>
  );
}
