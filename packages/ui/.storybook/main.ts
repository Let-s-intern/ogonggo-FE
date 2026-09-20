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
  //
  // 사이드바를 셋으로 가른다. 재사용 가능한 것(`Components`)과 이 앱 전용인 것(`App`)이 한
  // 덩어리로 섞이면 다음 사람이 무엇을 가져다 써도 되는지 알 수 없다.
  //
  // 제목 규칙. `titlePrefix` 는 자동 제목뿐 아니라 스토리가 명시한 `title` 앞에도 붙는다
  // (확인: `title: 'Foundations/Colors'` + `titlePrefix: 'Foundations'` 는
  // `Foundations/Foundations/Colors` 가 됐다). 그래서 어느 쪽도 묶음 이름을 직접 적지 않는다.
  // - `packages/ui` 스토리는 `title` 을 쓰지 않는다. `titlePrefix` + 파일 이름이 제목이다
  //   (`Components/Badge`, `Foundations/Colors`).
  // - `apps/web` 스토리는 `title` 을 쓰되 묶음 이름 아래만 적는다(`'카드 셋/JobCard'`).
  //   경로가 FSD 라 자동 제목이 `App/entities/job/ui/JobCard` 처럼 네 단계로 깊어지는데,
  //   이 카탈로그에서 보고 싶은 묶음은 폴더가 아니라 "카드 셋", "공고 상세" 같은 화면 단위다.
  stories: [
    { directory: '../src/foundations', files: '*.stories.@(ts|tsx)', titlePrefix: 'Foundations' },
    { directory: '../src/components', files: '*.stories.@(ts|tsx)', titlePrefix: 'Components' },
    { directory: webSrc, files: '**/*.stories.@(ts|tsx)', titlePrefix: 'App' },
  ],
  // `apps/web` 카드가 `shared/ui/Thumbnail.tsx` 의 기본 이미지(`/default-thumbnail.jpg`)로
  // 떨어진다. 이것을 붙이지 않으면 404 라 깨진 이미지가 뜨고, "이미지가 없을 때 어떻게
  // 보이는가" 를 스토리로 확인할 수가 없다.
  //
  // `apps/web/public` 폴더째 붙이지 않고 파일 하나만 집는다. 폴더에는 히어로 이미지 세 장과
  // 소개 화면 영상이 들어 있어 5MB 인데 스토리는 그중 어느 것도 쓰지 않는다. 폴더째 붙이면
  // 배포되는 스토리북이 15MB 가 되고, 그 5MB 는 웹 앱이 이미 자기 도메인에서 서빙한다.
  staticDirs: [
    {
      from: resolve(repoRoot, 'apps/web/public/default-thumbnail.jpg'),
      to: '/default-thumbnail.jpg',
    },
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // 스토리북의 Vite 에는 Tailwind 컴파일러가 없다. 이게 없으면 preview 가 불러오는
  // `src/styles/tokens.css` 의 `@import 'tailwindcss'` 가 컴파일되지 않고 그대로 나가서
  // 유틸리티 클래스가 한 줄도 생성되지 않는다 (apps/admin/vite.config.ts 와 같은 방식).
  viteFinal: (viteConfig, { configType }) => {
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
    //
    // `development` 를 빌드 모드에 맞춘다. 켜면 JSX 가 `jsxDEV()` 로 변환되는데 그 함수는
    // `react/jsx-dev-runtime` 에만 있다. 프로덕션 번들은 `react/jsx-runtime` 을 싣기 때문에
    // 켠 채로 `storybook build` 를 하면 배포된 스토리북에서 `apps/web` 스토리가 전부
    // `(0, p.jsxDEV) is not a function` 으로 죽는다. dev 서버에서는 멀쩡해서 눈에 띄지 않는다.
    viteConfig.oxc = {
      ...viteConfig.oxc,
      jsx: {
        ...(typeof viteConfig.oxc === 'object' && typeof viteConfig.oxc?.jsx === 'object'
          ? viteConfig.oxc.jsx
          : {}),
        runtime: 'automatic',
        development: configType === 'DEVELOPMENT',
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
