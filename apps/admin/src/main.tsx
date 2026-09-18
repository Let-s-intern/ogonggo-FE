import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setAccessTokenProvider } from '@ogonggo/api';
import { App } from './app/App';
import { enableMocking } from './app/enableMocking';
import './app/index.css';
import { getAccessToken } from './shared/api/accessToken';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root element not found');
}

// 어드민 API 호출에 로그인 토큰을 붙인다. 보관 방식은 accessToken.ts 주석에 있다.
setAccessTokenProvider(getAccessToken);

// 워커가 준비된 뒤에 렌더한다 — 이유는 enableMocking 주석에 있다.
void enableMocking().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
