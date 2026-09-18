import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { getAccessToken } from '@/shared/api/accessToken';
import { isMockEnabled } from './enableMocking';

/**
 * 토큰이 없으면 로그인 화면으로 보낸다. 로그인하면 원래 가려던 주소로 돌아온다.
 *
 * 목 모드에서는 검사하지 않는다. 목 핸들러는 토큰을 보지 않고, 화면 확인에 로그인을 끼울 이유가 없다.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (isMockEnabled || getAccessToken()) {
    return children;
  }
  return (
    <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  );
}
