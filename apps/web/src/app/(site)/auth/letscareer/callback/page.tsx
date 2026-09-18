import type { Metadata } from 'next';
import { LetsCareerCallbackPage } from '@/views/letscareer-callback';

export const metadata: Metadata = { title: '로그인' };

/**
 * 렛츠커리어 간편 로그인의 `redirect_uri`. 경로는 렛츠커리어 SSO 화이트리스트에 이 그대로 등록돼 있어 바꾸면
 * 로그인이 막힌다(`shared/api/letscareer.ts` 의 `LETSCAREER_CALLBACK_PATH`).
 */
export default function Page() {
  return <LetsCareerCallbackPage />;
}
