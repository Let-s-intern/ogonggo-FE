import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/react-vite';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const webSrc = resolve(repoRoot, 'apps/web/src');

const config: StorybookConfig = {
  // 스토리북은 `packages/ui` 전용 카탈로그가 아니라 저장소 전체 카탈로그다 (2026-09-21 결정).
  // `apps/web` 의 카드·상세 조각은 전부 props 로만 그려서 API 도 라우팅도 필요 없다 —
  // 막던 것은 `next/link` 하나였고 아래 alias 가 그것을 걷어낸다.
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    `${webSrc}/**/*.stories.@(ts|tsx)`,
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // 스토리북의 Vite 에는 Tailwind 컴파일러가 없다. 이게 없으면 preview 가 불러오는
  // `src/styles/tokens.css` 의 `@import 'tailwindcss'` 가 컴파일되지 않고 그대로 나가서
  // 유틸리티 클래스가 한 줄도 생성되지 않는다 (apps/admin/vite.config.ts 와 같은 방식).
  viteFinal: (viteConfig) => {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: {
        ...viteConfig.resolve?.alias,
        // `next/link` 는 Next 런타임 없이는 모듈 평가 자체가 실패한다. `<a>` 스텁으로 낮춘다.
        // 스텁이 무엇을 흉내내지 않는지는 `next-link.tsx` 상단에 적었다.
        'next/link': resolve(here, 'next-link.tsx'),
        // `apps/web` 의 `@/` 별칭 (apps/web/tsconfig.json 의 `paths`). 스토리가 컴포넌트를
        // 불러오면 그 컴포넌트가 다시 `@/shared/...` 를 부르므로 스토리 쪽만 고쳐서는 안 된다.
        '@/': `${webSrc}/`,
      },
    };
    // Vite 는 파일마다 가장 가까운 tsconfig 의 `jsx` 를 따른다. `apps/web/tsconfig.json` 은
    // Next 가 요구하는 `"jsx": "preserve"` 라서, 그대로 두면 `apps/web` 의 .tsx 는 타입만
    // 벗겨지고 JSX 가 남은 채 나가 `vite:import-analysis` 가
    // "content contains invalid JS syntax" 로 죽는다 (packages/ui 는 `react-jsx` 라 멀쩡하다).
    // 스토리북 쪽에서만 JSX 변환을 강제한다 — `apps/web/tsconfig.json` 은 건드리지 않는다.
    viteConfig.oxc = {
      ...viteConfig.oxc,
      jsx: {
        ...(typeof viteConfig.oxc === 'object' && typeof viteConfig.oxc?.jsx === 'object'
          ? viteConfig.oxc.jsx
          : {}),
        runtime: 'automatic',
        development: true,
      },
    };
    viteConfig.server = {
      ...viteConfig.server,
      fs: {
        ...viteConfig.server?.fs,
        // 스토리 파일이 `packages/ui` 바깥(`apps/web/src`)에 있다. Vite 의 기본 허용 범위는
        // 설정 파일이 있는 곳 기준이라 저장소 루트를 열어줘야 읽힌다.
        allow: [...(viteConfig.server?.fs?.allow ?? []), repoRoot],
      },
    };
    return viteConfig;
  },
};

export default config;
