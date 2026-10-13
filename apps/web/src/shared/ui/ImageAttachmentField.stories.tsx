import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ImageAttachmentField, type ImageAttachment } from './ImageAttachmentField';

/**
 * 사진 첨부 칸. 폭은 취준고민 작성 모달의 본문 폭(664px)에 맞춘다.
 *
 * 스토리북에는 목 서버가 없어 새로 고른 사진은 올리기에 실패해 `다시 시도` 상태가 된다. 실제로 올라가는
 * 흐름은 웹 앱 목 모드에서 본다. 미리보기 이미지는 스토리북이 붙여 둔 `/icon-192.png` 다.
 */
const IMAGE = '/icon-192.png';

const done = (n: number): ImageAttachment[] =>
  Array.from({ length: n }, (_, index) => ({
    key: `done-${index}`,
    status: 'done',
    id: `image-${index}`,
    url: IMAGE,
  }));

const meta: Meta<typeof ImageAttachmentField> = {
  title: '작성 폼/ImageAttachmentField',
  component: ImageAttachmentField,
  args: {
    usage: 'CONCERN',
    notice: '이름, 연락처 등 개인정보는 가린 뒤 첨부해주세요.',
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <ImageAttachmentField {...args} value={value} onChange={setValue} />;
  },
  decorators: [
    (Story) => (
      <div className="max-w-[664px] bg-white p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ImageAttachmentField>;

export const Empty: Story = { args: { value: [] } };

export const One: Story = { args: { value: done(1) } };

/** 3장이면 `이미지 추가하기` 상자가 사라진다. */
export const Three: Story = { args: { value: done(3) } };

export const Uploading: Story = {
  args: { value: [...done(1), { key: 'uploading', status: 'uploading', url: IMAGE }] },
};

export const Failed: Story = {
  args: { value: [...done(1), { key: 'failed', status: 'failed', url: IMAGE }] },
};

/** 사이드·스터디. 첫 칸에 `대표` 가 붙고 안내에 썸네일 문구가 더해진다. */
export const Cover: Story = {
  args: {
    usage: 'RECRUITMENT_POST',
    value: done(2),
    markCover: true,
    notice: '첫 번째 사진이 목록 썸네일로 쓰여요.',
  },
};
