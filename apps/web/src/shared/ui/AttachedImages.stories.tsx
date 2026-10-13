import type { Meta, StoryObj } from '@storybook/react';
import { AttachedImages } from './AttachedImages';

/**
 * 상세 본문 아래 사진 줄. 폭은 취준고민 상세 카드의 본문 폭에 가깝게 둔다. 375px 에서는 세로로 쌓인다.
 * 이미지는 스토리북이 붙여 둔 `/icon-192.png` 다 — 정사각이라 칸 양옆에 회색 바탕이 보이는 것이
 * `object-contain` 그대로다.
 */
const images = (n: number) =>
  Array.from({ length: n }, (_, index) => ({ id: `image-${index}`, url: '/icon-192.png' }));

const meta: Meta<typeof AttachedImages> = {
  title: '상세 조각/AttachedImages',
  component: AttachedImages,
  decorators: [
    (Story) => (
      <div className="max-w-[880px] bg-white p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AttachedImages>;

export const One: Story = { args: { images: images(1) } };

export const Two: Story = { args: { images: images(2) } };

export const Three: Story = { args: { images: images(3) } };
