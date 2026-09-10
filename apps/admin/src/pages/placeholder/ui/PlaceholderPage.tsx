import { Card, CardDescription, CardTitle } from '@ogonggo/ui';

export interface PlaceholderPageProps {
  title: string;
}

/**
 * 라우트는 있고 화면은 아직 없는 자리.
 *
 * 빈 화면 대신 이걸 두는 이유는, 메뉴를 눌렀을 때 아무 일도 안 일어나는 것과 화면이 아직
 * 없는 것이 구분되어야 하기 때문이다. 화면이 붙으면 이 라우트는 실제 컴포넌트로 바뀐다.
 */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <>
      <h1 className="pb-6 text-xl font-bold text-gray-900">{title}</h1>
      <Card>
        <CardTitle>아직 만들지 않은 화면입니다</CardTitle>
        <CardDescription className="pt-2">
          메뉴와 라우트만 자리를 잡아 둔 상태입니다.
        </CardDescription>
      </Card>
    </>
  );
}
