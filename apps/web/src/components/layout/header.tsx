'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { isLoggedIn, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'HOME', testId: 'nav-home' },
    { href: '/medicine-box', label: 'MY BOX', testId: 'nav-medicine-box' },
    { href: '/analysis', label: 'ANALYSIS', testId: 'nav-analysis' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" data-testid="header">
      <div className="max-w-[1400px] mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight" data-testid="header-logo">
          MFCC<span className="text-accent">.</span>
        </Link>

        <nav className="flex items-center gap-8" data-testid="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[12px] font-semibold tracking-[0.1em] transition-colors ${
                pathname === item.href
                  ? 'text-accent'
                  : 'text-white/60 hover:text-white'
              }`}
              data-testid={item.testId}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {isLoggedIn ? (
          <button
            onClick={logout}
            className="text-[12px] font-semibold tracking-[0.05em] text-white/60 hover:text-white transition-colors"
            data-testid="nav-logout"
          >
            LOGOUT
          </button>
        ) : (
          <Link
            href="/auth/login"
            className="text-[12px] font-semibold tracking-[0.05em] px-5 py-2.5 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all"
            data-testid="nav-login"
          >
            LOGIN
          </Link>
        )}
      </div>
    </header>
  );
}
