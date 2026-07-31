import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';

import { Providers } from './providers';
import { Header } from '@/components/layout/header';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  title: 'MFCC — Medicine-Food Commercial Checker',
  description: '복용 중인 약과 음식의 상호작용을 확인하세요',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <Header />
          <main>
            {children}
          </main>
          <footer className="border-t border-white/10 bg-slate-950/80 py-4 text-center text-sm text-white/50">
            이 서비스는 참고용입니다. 실제 복용 판단과 치료 계획은 의사 또는 약사 등 전문가와 상담해주세요.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
