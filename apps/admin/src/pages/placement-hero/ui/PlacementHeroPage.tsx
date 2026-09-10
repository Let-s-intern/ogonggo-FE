import { useState } from 'react';
import { Button, Callout, Card, CardTitle, Field, Input, Select } from '@ogonggo/ui';
import { PageHeader } from '@/widgets/page-header';

/**
 * 메인 배너(히어로) 편집 화면. **하드코딩이다.**
 *
 * 목 핸들러도 API 계약도 없다. 배너 관리는 나중에 제대로 구현할 것이고, 지금은 메뉴와 화면
 * 골격이 어떤 모양인지 눈으로 확인하는 데까지다(PRD "지면 · 메인 배너").
 *
 * 저장 버튼은 아무것도 저장하지 않고 그 사실을 알린다. 저장한 것처럼 보이게 만들지 않는다 —
 * 저장된 줄 알고 운영자가 기다리는 쪽이 더 나쁘다.
 *
 * 아래 문구는 사용자 웹에 지금 하드코딩되어 있는 값을 옮겨 적은 것이다
 * (`apps/web/src/views/home/ui/HomePage.tsx` 등이 `HomeHero` 에 넘기는 props).
 */

interface HeroPlacement {
  code: string;
  location: string;
  badge: string;
  headlineLines: string[];
  emphasisWords: string[];
}

const PLACEMENTS: HeroPlacement[] = [
  {
    code: 'HOME_HERO',
    location: '홈(채용공고) 최상단',
    badge: '커리어 여정 맞춤 추천',
    headlineLines: ['커리어 여정에 딱! 맞는', '채용공고만 쏙! 보여드려요'],
    emphasisWords: ['딱!', '쏙!'],
  },
  {
    code: 'BOOTCAMP_HERO',
    location: '부트캠프 목록 최상단',
    badge: '실무 중심 교육',
    headlineLines: ['실무를 배울 수 있는', '교육만 골라 모았어요'],
    emphasisWords: [],
  },
  {
    code: 'SIDE_STUDY_HERO',
    location: '사이드·스터디 목록 최상단',
    badge: '함께할 사람 찾기',
    headlineLines: ['혼자 말고,', '함께할 사람을 찾아보세요'],
    emphasisWords: [],
  },
];

export function PlacementHeroPage() {
  const [selectedCode, setSelectedCode] = useState(PLACEMENTS[0]?.code ?? '');
  const [notice, setNotice] = useState<string | null>(null);

  const placement = PLACEMENTS.find((entry) => entry.code === selectedCode) ?? PLACEMENTS[0];

  if (!placement) {
    return null;
  }

  return (
    <>
      <PageHeader title="메인 배너" />

      <Callout tone="warning" className="mb-4">
        아직 저장되지 않는 화면입니다. 지면과 입력 칸의 모양만 잡아 둔 상태이고, 아래 값은 사용자
        웹에 하드코딩되어 있는 현재 문구입니다.
      </Callout>

      <Card>
        <CardTitle>지면</CardTitle>
        <div className="pt-4">
          <Field label="편집할 지면" htmlFor="placement">
            <Select
              id="placement"
              className="w-full"
              value={selectedCode}
              onChange={(event) => {
                setSelectedCode(event.target.value);
                setNotice(null);
              }}
              options={PLACEMENTS.map((entry) => ({
                value: entry.code,
                label: `${entry.code} — ${entry.location}`,
              }))}
            />
          </Field>
        </div>
      </Card>

      <Card className="mt-4">
        <CardTitle>배너 내용</CardTitle>

        {notice ? (
          <Callout tone="warning" className="mt-4">
            {notice}
          </Callout>
        ) : null}

        <div className="pt-4">
          <Field label="배지 문구" htmlFor="badge">
            <Input id="badge" defaultValue={placement.badge} key={`${placement.code}-badge`} />
          </Field>

          <Field
            label="헤드라인"
            htmlFor="headline"
            hint="줄바꿈 하나가 화면의 한 줄입니다. HomeHero 의 headlineLines 와 같습니다."
          >
            <textarea
              id="headline"
              key={`${placement.code}-headline`}
              rows={3}
              defaultValue={placement.headlineLines.join('\n')}
              className="w-full rounded-md border border-gray-300 p-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <Field
            label="강조 단어"
            htmlFor="emphasis"
            hint="쉼표로 구분합니다. 헤드라인 안에서 초록 이탤릭으로 나갑니다."
          >
            <Input
              id="emphasis"
              key={`${placement.code}-emphasis`}
              defaultValue={placement.emphasisWords.join(', ')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="게재 시작" htmlFor="start-at">
              <Input id="start-at" type="date" />
            </Field>
            <Field label="게재 종료" htmlFor="end-at">
              <Input id="end-at" type="date" />
            </Field>
          </div>

          <Button onClick={() => setNotice('아직 연결되지 않았습니다. 저장되지 않았습니다.')}>
            저장
          </Button>
        </div>
      </Card>
    </>
  );
}
