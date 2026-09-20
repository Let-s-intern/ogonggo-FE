import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  args: { page: 1, totalPages: 30, onChange: () => {} },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

/** 첫 묶음. `이전`은 갈 곳이 없어 비활성이다. */
export const FirstBlock: Story = {};

/** 같은 묶음 안에서 7페이지를 보고 있어도 번호줄은 `1~10` 그대로다. */
export const MidBlock: Story = { args: { page: 7 } };

/** 다음 묶음. `이전`은 1페이지로, `다음`은 21페이지로 간다 — 한 장이 아니라 묶음 단위다. */
export const SecondBlock: Story = { args: { page: 11 } };

/** 마지막 묶음은 딱 떨어지지 않으면 짧아진다. 23페이지짜리의 마지막 묶음은 `21 22 23`이다. */
export const PartialLastBlock: Story = { args: { page: 21, totalPages: 23 } };

/** 전체가 한 묶음 안에 들어가면 `이전`·`다음` 둘 다 비활성이다. */
export const SingleBlock: Story = { args: { page: 3, totalPages: 10 } };

/** 한 페이지뿐이면 아무것도 그리지 않는다. */
export const SinglePage: Story = { args: { totalPages: 1 } };
