import { type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

/**
 * 목록이 비었을 때 자리를 채우는 상자. 점선 테두리는 "아직 아무것도 없다" 와 "무언가 잘못됐다"
 * 를 구분하려고 쓴다 — 실선이면 내용이 있는 카드처럼 보인다.
 *
 * `title` 만 필수다. `description` 과 `action` 은 있을 때만 그려지고, 셋 다 넣으면 세로로
 * 쌓인다. 아래 네 칸이 그 조합 전부다.
 *
 * 실패를 이걸로 그리지 않는다. 빈 목록과 불러오기 실패는 사용자가 할 일이 다르다.
 */
const meta: Meta<typeof EmptyState> = {
  component: EmptyState,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div>
      <p className="pb-2 text-xs font-bold text-gray-500">{caption}</p>
      {children}
    </div>
  );
}

/** title / description / action 조합 전부를 한 화면에. */
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-5xl grid-cols-2 gap-x-8 gap-y-8">
      <Cell caption="title 만">
        <EmptyState title="등록된 공고가 없습니다." />
      </Cell>

      <Cell caption="title + description">
        <EmptyState
          title="등록된 공고가 없습니다."
          description="기업이 공고를 올리면 여기에 나타납니다."
        />
      </Cell>

      <Cell caption="title + action">
        <EmptyState
          title="찜한 공고가 없습니다."
          action={<Button size="sm">공고 둘러보기</Button>}
        />
      </Cell>

      <Cell caption="title + description + action — 셋 다">
        <EmptyState
          title="검색 결과가 없습니다."
          description="조건을 줄이면 더 많은 공고를 볼 수 있습니다."
          action={
            <Button variant="secondary" size="sm">
              필터 초기화
            </Button>
          }
        />
      </Cell>

      <Cell caption="문구가 길어졌을 때 — 가운데 정렬은 그대로">
        <EmptyState
          title="아직 승인된 기업이 없습니다."
          description="기업 회원이 가입하고 사업자등록번호 심사를 통과하면 이 목록에 나타납니다. 심사는 보통 하루 안에 끝납니다."
        />
      </Cell>

      <Cell caption="높이는 className 으로 — py-20">
        <EmptyState title="등록된 공고가 없습니다." className="py-20" />
      </Cell>
    </div>
  ),
};
