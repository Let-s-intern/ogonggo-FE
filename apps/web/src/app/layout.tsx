import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import {
  GoogleTagManagerNoScript,
  GoogleTagManagerScript,
} from '@/shared/analytics/GoogleTagManager';
import { AppProviders } from './providers';
import './globals.css';

/*
 * 프리텐다드 가변 폰트. 파일은 저장소에 한 부만 있고(`packages/ui/src/styles/fonts/`),
 * admin 과 스토리북도 같은 파일을 가리킨다. 출처와 버전은 그 디렉터리의 README 에 있다.
 *
 * `weight` 는 파일이 실제로 가진 무게 축 범위다. 이걸 적어야 `font-weight: 600` 같은 값이
 * 가짜 볼드가 아니라 축 보간으로 그려진다.
 *
 * `next/font/local` 은 패밀리 이름을 직접 정하게 해주지 않는다. 빌드 결과의 `@font-face` 는
 * `font-family: pretendard` 로 나오고(변수 이름에서 딴 것이다), 그래서 이 폰트는
 * `--font-pretendard` 로만 부를 수 있다. `tokens.css` 의 `--font-sans` 에 적힌
 * `'Pretendard Variable'` 이라는 이름으로는 잡히지 않는다. 두 이름을 잇는 일은
 * `--font-sans` 를 고치는 결정이라 이 작업에서 하지 않았다.
 */
const pretendard = localFont({
  src: '../../../../packages/ui/src/styles/fonts/PretendardVariable.woff2',
  weight: '45 920',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-pretendard',
});

/**
 * 파비콘·앱 아이콘은 파일 규칙이 잡는다 — `app/icon.svg`, `app/apple-icon.png`,
 * `app/manifest.ts`. 여기에 `icons`를 다시 적지 않는다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md).
 *
 * `title.template`은 하위 화면이 자기 제목만 넘기면 뒤에 서비스명이 붙게 한다.
 */
export const metadata: Metadata = {
  title: {
    default: '오늘의 공고',
    template: '%s | 오늘의 공고',
  },
  description: '커리어 여정에 딱 맞는 채용공고, 교육·부트캠프, 사이드·스터디를 모아 봅니다.',
  applicationName: '오늘의 공고',
  openGraph: {
    type: 'website',
    siteName: '오늘의 공고',
    title: '오늘의 공고',
    description: '커리어 여정에 딱 맞는 채용공고, 교육·부트캠프, 사이드·스터디를 모아 봅니다.',
    locale: 'ko_KR',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      {/*
        GTM 안내문은 "`<head>` 최대한 위쪽" 이라고 하지만 App Router 에서는 그 자리를 직접
        고를 수 없다. `next/script` 가 알아서 넣고, 이유는 컴포넌트 주석에 있다.
      */}
      <GoogleTagManagerScript />
      <body>
        <GoogleTagManagerNoScript />
        {/*
          헤더·푸터는 여기가 아니라 `(site)/layout.tsx`가 단다. 소개 페이지(`/about`)는 그
          그룹 밖이라 껍데기 없이 렌더된다.
        */}
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
