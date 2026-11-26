import { MockModeFrame } from '@ogonggo/ui';
import { RouterProvider } from 'react-router';
import { isMockEnabled } from './enableMocking';
import { AppProviders } from './providers';
import { router } from './routes';

export function App() {
  return (
    <AppProviders>
      {/* 목데이터로 동작 중임을 화면 테두리와 라벨로 알린다. 라우터 밖이라 어느 화면에서나 보인다. */}
      <MockModeFrame enabled={isMockEnabled} />
      <RouterProvider router={router} />
    </AppProviders>
  );
}
