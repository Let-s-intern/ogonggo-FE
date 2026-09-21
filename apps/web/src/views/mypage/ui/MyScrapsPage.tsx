import { MyScraps, type MyScrapsQuery } from '@/widgets/my-scraps';

export type MyScrapsPageProps = MyScrapsQuery;

/**
 * `/mypage/scraps` 본문(PRD 2 절). 바깥 껍데기(사이드바·로그인 가드) 는
 * `app/(site)/mypage/layout.tsx` 가 그린 `MyPageLayout` 이라 여기는 본문만 넘긴다.
 */
export function MyScrapsPage(query: MyScrapsPageProps) {
  return <MyScraps query={query} />;
}
