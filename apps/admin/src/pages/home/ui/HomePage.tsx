import { Button, Card, CardTitle } from '@ogonggo/ui';

export function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-96">
        <CardTitle>오공고 관리자</CardTitle>
        <Button className="mt-4">시작하기</Button>
      </Card>
    </main>
  );
}
