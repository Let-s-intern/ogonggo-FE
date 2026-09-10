import { Link } from 'react-router';
import { Card, CardDescription, CardTitle } from '@ogonggo/ui';

/** 메뉴에 없는 주소로 들어왔을 때. 없으면 react-router 의 기본 오류 화면이 나온다. */
export function NotFoundPage() {
  return (
    <>
      <h1 className="pb-6 text-xl font-bold text-gray-900">없는 화면입니다</h1>
      <Card>
        <CardTitle>주소를 확인해 주세요</CardTitle>
        <CardDescription className="pt-2">
          좌측 메뉴에 없는 주소입니다.{' '}
          <Link to="/" className="text-blue-600 underline">
            대시보드로 돌아가기
          </Link>
        </CardDescription>
      </Card>
    </>
  );
}
