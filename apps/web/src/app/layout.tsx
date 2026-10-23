import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';

import { Providers } from './providers';
import { Header } from '@/components/layout/header';
import './globals.css';

// next/font/google 은 **빌드 시점에** 구글에서 폰트를 받는다. CI 러너에서 그게
// 간헐적으로 실패해 Build job 이 내 변경과 무관하게 깨졌다
// ("An error occured in `next/font`. TypeError: Cannot read properties of null").
// 파일을 저장소에 두면 빌드가 네트워크를 타지 않는다.
//
// 가변 폰트 한 파일(48KB, latin 서브셋)이 400~900 을 다 덮는다. 받아 둔 것은
// next/font/google 이 쓰던 바로 그 파일이다 (fonts.gstatic.com Inter v20 latin).
const inter = localFont({
  src: './fonts/Inter-latin.woff2',
  weight: '400 900',
  display: 'swap',
});

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
