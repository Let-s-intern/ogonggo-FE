import { type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { DescriptionList, type DescriptionItem } from './DescriptionList';

/**
 * 상세 화면의 라벨-값 목록. `dl`/`dt`/`dd` 라 화면 낭독기가 짝으로 읽는다.
 *
 * `columns` 는 1~4 고 기본은 2 다. 항목에 `full: true` 를 주면 그 항목만 한 줄을 통째로
 * 쓴다 — 본문이나 URL 처럼 길어서 한 칸에 안 들어가는 값이 그 경우다.
 *
 * `value` 는 `ReactNode` 라 배지든 링크든 그대로 넣는다. 아래 마지막 칸이 그 경우다.
 */
const BASE: DescriptionItem[] = [
  { label: '회사', value: '오공고 주식회사' },
  { label: '지역', value: '서울 강남구' },
  { label: '경력', value: '신입' },
  { label: '고용형태', value: '정규직' },
];

const meta: Meta<typeof DescriptionList> = {
  component: DescriptionList,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DescriptionList>;

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="pb-3 text-xs font-bold text-gray-500">{caption}</p>
      {children}
    </div>
  );
}

/** columns 네 값과 full, 그리고 ReactNode 값을 한 화면에. */
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-5xl grid-cols-2 gap-4">
      <Cell caption="columns 기본값 2">
        <DescriptionList items={BASE} />
      </Cell>

      <Cell caption="columns 1 — 좁은 화면이나 값이 긴 경우">
        <DescriptionList items={BASE} columns={1} />
      </Cell>

      <Cell caption="columns 3">
        <DescriptionList items={BASE} columns={3} />
      </Cell>

      <Cell caption="columns 4">
        <DescriptionList items={BASE} columns={4} />
      </Cell>

      <Cell caption="full: true — 그 항목만 한 줄을 통째로">
        <DescriptionList
          items={[
            ...BASE,
            {
              label: '공고 주소',
              value: 'https://ogonggo.example.com/jobs/2026-08-frontend-newcomer',
              full: true,
            },
          ]}
        />
      </Cell>

      <Cell caption="value 는 ReactNode — 배지도 링크도 그대로">
        <DescriptionList
          items={[
            { label: '상태', value: <Badge tone="success">승인됨</Badge> },
            { label: '마감', value: <Badge tone="urgent">D-2</Badge> },
            {
              label: '원문',
              value: (
                <a className="text-blue-500 underline" href="https://ogonggo.example.com">
                  원문 보기
                </a>
              ),
              full: true,
            },
          ]}
        />
      </Cell>
    </div>
  ),
};
