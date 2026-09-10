import { useState } from 'react';
import { Button, Callout, Card, CardTitle, Field, Input } from '@ogonggo/ui';
import { PageHeader } from '@/widgets/page-header';

/**
 * 중간 배너 편집 화면. 메인 배너와 같이 **하드코딩이다.**
 *
 * 자리는 홈의 인기 공고와 전체 공고 사이 하나(`HOME_MID`)이고, 사용자 웹에서는 아직 회색 div
 * 가 자리만 잡고 있다(`apps/web/src/views/home/ui/HomePage.tsx`).
 *
 * 대체 텍스트는 비워둘 수 없는 칸이다. 광고 이미지에 대체 텍스트가 없으면 스크린 리더 사용자
 * 에게는 그 자리가 통째로 사라진다. 지금은 저장이 없으니 검사도 없지만, 계약을 정할 때 필수
 * 칸으로 넘긴다.
 */
export function PlacementMidPage() {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="중간 배너" />

      <Callout tone="warning" className="mb-4">
        아직 저장되지 않는 화면입니다. 입력 칸의 모양만 잡아 둔 상태입니다.
      </Callout>

      <Card>
        <CardTitle>HOME_MID — 홈 인기 공고와 전체 공고 사이</CardTitle>
        <div className="pt-4">
          <Field label="이미지 주소" htmlFor="image-url" required>
            <Input id="image-url" placeholder="https://" />
          </Field>

          <Field
            label="대체 텍스트"
            htmlFor="alt-text"
            hint="비워둘 수 없습니다. 이미지가 뜨지 않거나 스크린 리더로 읽을 때 이 문구가 쓰입니다."
            required
          >
            <Input id="alt-text" />
          </Field>

          <Field label="클릭 시 이동할 주소" htmlFor="link-url" required>
            <Input id="link-url" placeholder="https://" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="게재 시작" htmlFor="mid-start-at">
              <Input id="mid-start-at" type="date" />
            </Field>
            <Field label="게재 종료" htmlFor="mid-end-at">
              <Input id="mid-end-at" type="date" />
            </Field>
          </div>

          <label className="flex items-center gap-2 pb-4 text-sm text-gray-700">
            <input type="checkbox" />
            활성
          </label>

          <Button onClick={() => setNotice('아직 연결되지 않았습니다. 저장되지 않았습니다.')}>
            저장
          </Button>

          {notice ? (
            <Callout tone="warning" className="mt-4">
              {notice}
            </Callout>
          ) : null}
        </div>
      </Card>
    </>
  );
}
