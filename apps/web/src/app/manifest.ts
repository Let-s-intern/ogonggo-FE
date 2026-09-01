import type { MetadataRoute } from 'next';

/**
 * `app/manifest.ts`는 Next가 `/manifest.webmanifest`로 내보내는 파일 규칙이다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md).
 *
 * 아이콘은 `public/`의 PNG를 쓴다 — `app/icon.svg`는 브라우저 탭용이고, 홈 화면에 추가할 때
 * 안드로이드는 SVG를 안 받는 기기가 있어 192·512 PNG를 함께 둔다.
 *
 * 색은 로고와 헤더가 쓰는 파랑이다(`packages/ui/src/styles/tokens.css`의 `--color-blue-500`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '오늘의 공고',
    short_name: '오공고',
    description: '커리어 여정에 딱 맞는 채용공고, 교육·부트캠프, 사이드·스터디를 모아 봅니다.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4a76ff',
    lang: 'ko',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
