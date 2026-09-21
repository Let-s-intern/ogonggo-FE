import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Preview } from '@storybook/react';
import { ToastProvider } from '../src/components/Toast';
import './tailwind.css';
import './preview.css';

/**
 * 스토리 전체를 감싸는 프로바이더 둘. `apps/web` 의 북마크 버튼(`features/bookmark`)이
 * react-query 와 토스트를 쓰는데, 그 버튼이 카드 넷과 상세 CTA 에 들어 있어 스토리 다섯 벌이
 * 같은 것을 필요로 한다. 스토리마다 데코레이터를 두면 다섯 벌이 되고 여기면 한 벌이다.
 *
 * 셋째인 `next/navigation` 의 라우터는 데코레이터로 줄 수 없다 — 진짜 훅이 컨텍스트가 없으면
 * 던지기 때문에 모듈 자체를 갈아끼워야 한다. `main.ts` 의 `resolve.alias` 와
 * `next-navigation.tsx` 가 그 자리다.
 *
 * `QueryClient` 는 스토리 전체가 하나를 나눠 쓴다. 로그인하지 않은 상태라 북마크 id 모음
 * 쿼리는 `enabled: false` 여서 실제로 도는 요청이 없다 — 나눠 써도 스토리 사이에 남는 것이
 * 없다. `retry: false` 는 혹시 도는 요청이 생겼을 때 실패를 세 번 반복하지 않게 하는 것이다.
 */
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </QueryClientProvider>
    ),
  ],
};

export default preview;
