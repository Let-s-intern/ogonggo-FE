import { Navigate, useLocation } from 'react-router';

/**
 * 옮긴 화면의 옛 주소를 새 주소로 넘긴다. 주소의 거르기(`?...`)는 그대로 들고 가고, 이름이 바뀐 칸은 `rename` 으로 바꾼다
 * (예: 인스타 광고의 `account` → 채널 광고의 `channel`).
 */
export function RedirectKeepingSearch({
  to,
  rename = {},
}: {
  to: string;
  rename?: Record<string, string>;
}) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  for (const [from, next] of Object.entries(rename)) {
    const value = params.get(from);
    if (value !== null) {
      params.delete(from);
      params.set(next, value);
    }
  }
  const query = params.toString();
  return <Navigate to={{ pathname: to, search: query ? `?${query}` : '' }} replace />;
}
