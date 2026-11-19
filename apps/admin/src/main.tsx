import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setAccessTokenProvider, setUnauthorizedHandler } from '@ogonggo/api';
import { App } from './app/App';
import { enableMocking } from './app/enableMocking';
import './app/index.css';
import { getAccessToken } from './shared/api/accessToken';
import { handleUnauthorized } from './shared/api/reissue';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root element not found');
}

// 어드민 API 호출에 로그인 토큰을 붙인다. 보관 방식은 accessToken.ts 주석에 있다.
setAccessTokenProvider(getAccessToken);
// 액세스 토큰(30분)이 끝나면 리프레시 토큰으로 다시 받아 원 요청을 한 번 더 보낸다(reissue.ts).
setUnauthorizedHandler(handleUnauthorized);

// 워커가 준비된 뒤에 렌더한다 — 이유는 enableMocking 주석에 있다.
void enableMocking().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
