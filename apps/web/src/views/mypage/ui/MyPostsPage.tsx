import { MyPosts, type MyPostsQuery } from '@/widgets/my-posts';

export type MyPostsPageProps = MyPostsQuery;

/**
 * `/mypage/posts` 본문(PRD 4 절). 바깥 껍데기(사이드바·로그인 가드) 는
 * `app/(site)/mypage/layout.tsx` 가 그린 `MyPageLayout` 이라 여기는 본문만 넘긴다.
 */
export function MyPostsPage(query: MyPostsPageProps) {
  return <MyPosts query={query} />;
}
