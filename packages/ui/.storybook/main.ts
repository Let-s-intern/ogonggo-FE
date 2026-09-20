import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // 스토리북의 Vite 에는 Tailwind 컴파일러가 없다. 이게 없으면 preview 가 불러오는
  // `src/styles/tokens.css` 의 `@import 'tailwindcss'` 가 컴파일되지 않고 그대로 나가서
  // 유틸리티 클래스가 한 줄도 생성되지 않는다 (apps/admin/vite.config.ts 와 같은 방식).
  viteFinal: (viteConfig) => {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    return viteConfig;
  },
};

export default config;
